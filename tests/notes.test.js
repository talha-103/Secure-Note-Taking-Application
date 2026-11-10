import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createNotesService } from '../src/modules/notes/notes.service.js';

const env = {
  JWT_SECRET: 'test secret used only by the notes tests',
  JWT_EXPIRES_IN: 60,
};
const owner = '5f53fe68d17a92590c842811';
const admin = '5f53fe68d17a92590c842812';
const _id = '5f53fe68d17a92590c842813';

function setup(model) {
  const api = request(
    createApp({
      env,
      accountStore: {
        findById: async (id) => ({
          _id: id,
          role: id === admin ? 'admin' : 'user',
        }),
      },
      noteService: createNotesService(model),
    }),
  );
  return {
    api,
    send: (method, path, id = owner) =>
      api[method](path).set(
        'Authorization',
        'Bearer ' + jwt.sign({}, env.JWT_SECRET, { subject: id }),
      ),
  };
}

test('scopes every note read and mutation to the authenticated owner', async () => {
  let note = { _id, owner, title: 'Original' };
  const own = (filter) =>
    note?._id === filter._id && note?.owner === filter.owner;
  const { api, send } = setup({
    findOne: (filter) => (own(filter) ? note : null),
    findOneAndUpdate: (filter, fields) =>
      own(filter) ? (note = { ...note, ...fields }) : null,
    findOneAndDelete: (filter) => {
      if (!own(filter)) return null;
      const deleted = note;
      note = null;
      return deleted;
    },
  });
  const path = '/api/notes/' + _id;
  await api.get(path).expect(401);
  await send('get', path, admin).expect(404);
  await send('put', path, admin).send({ title: 'Blocked' }).expect(404);
  await send('delete', path, admin).expect(404);
  await send('get', '/api/notes/invalid').expect(400);
  await send('get', path).expect(200);
  const edited = await send('put', path)
    .send({ title: 'Edited', owner: admin })
    .expect(200);
  assert.equal(edited.body.title, 'Edited');
  assert.equal(edited.body.owner, owner);
  await send('delete', path).expect(204);
  await send('get', path).expect(404);
});

test('sets the owner from authentication and validates the note content', async () => {
  const { send } = setup({ create: (fields) => ({ _id, ...fields }) });
  await send('post', '/api/notes').send({ title: ' ' }).expect(400);
  const response = await send('post', '/api/notes')
    .send({ title: ' New ', owner: admin })
    .expect(201);
  assert.deepEqual(response.body, { _id, owner, title: 'New', content: '' });
});

test('paginates owned notes and lets only admins list every note', async () => {
  const calls = [];
  const { send } = setup({
    find(filter) {
      calls.push(filter);
      return {
        sort(value) {
          calls.push(value);
          return this;
        },
        skip(value) {
          calls.push(value);
          return this;
        },
        limit(value) {
          calls.push(value);
          return this;
        },
        lean() {
          return [];
        },
      };
    },
    countDocuments(filter) {
      calls.push(filter);
      return { hint: () => (filter.owner ? 2 : 5) };
    },
  });

  await send('get', '/api/admin/notes').expect(403);
  await send('get', '/api/notes?limit=101').expect(400);
  assert.deepEqual(calls, []);
  const owned = await send('get', '/api/notes?page=2&limit=1').expect(200);
  assert.deepEqual(owned.body, { data: [], page: 2, limit: 1, total: 2 });
  assert.deepEqual(calls.splice(0), [{ owner }, { _id: -1 }, 1, 1, { owner }]);
  const all = await send('get', '/api/admin/notes', admin).expect(200);
  assert.deepEqual(all.body, { data: [], page: 1, limit: 20, total: 5 });
  assert.deepEqual(calls, [{}, { _id: -1 }, 0, 20, {}]);
});
