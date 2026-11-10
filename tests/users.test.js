import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createUsersService } from '../src/modules/users/users.service.js';

const env = {
  JWT_SECRET: 'test secret used only by the users tests',
  JWT_EXPIRES_IN: 60,
};
const adminId = '5f53fe68d17a92590c842811';
const userId = '5f53fe68d17a92590c842812';

function setup(model) {
  const api = request(
    createApp({
      env,
      accountStore: {
        findById: async (id) => ({
          _id: id,
          role: id === adminId ? 'admin' : 'user',
        }),
      },
      userService: createUsersService(model),
    }),
  );
  return (method, path, id = adminId) =>
    api[method](path).set(
      'Authorization',
      'Bearer ' + jwt.sign({}, env.JWT_SECRET, { subject: id }),
    );
}

test('authorizes and validates user lists and returns the requested page with a total', async () => {
  const steps = [];
  const row = {
    _id: userId,
    email: 'user@example.com',
    role: 'user',
    interests: [],
    passwordHash: 'hidden',
  };
  const query = {
    select() {
      return this;
    },
    sort(value) {
      steps.push(value);
      return this;
    },
    skip(value) {
      steps.push(value);
      return this;
    },
    limit(value) {
      steps.push(value);
      return this;
    },
    lean() {
      return [row];
    },
  };
  const send = setup({
    find: () => query,
    countDocuments: () => ({ hint: () => 3 }),
  });
  await send('get', '/api/admin/users', userId).expect(403);
  await send('get', '/api/admin/users?limit=101').expect(400);
  assert.deepEqual(steps, []);
  const response = await send('get', '/api/admin/users?page=2&limit=1').expect(
    200,
  );
  assert.deepEqual(steps, [{ _id: -1 }, 1, 1]);
  assert.equal(response.body.data[0].passwordHash, undefined);
  assert.equal(response.body.total, 3);
  assert.equal(response.body.page, 2);
  assert.equal(response.body.limit, 1);
});

test('validates account updates and prohibits changing your own role', async () => {
  const send = setup({});
  await send('patch', '/api/admin/users/' + adminId)
    .send({ role: 'user' })
    .expect(400);
  await send('patch', '/api/admin/users/' + userId)
    .send({ passwordHash: 'untrusted' })
    .expect(400);
  await send('delete', '/api/admin/users/' + adminId).expect(400);
});

test('gets filtered interest groups and their total from one aggregation', async () => {
  const pipelines = [];
  const data = [
    { _id: 'chess', users: [{ _id: userId, email: 'user@example.com' }] },
  ];
  const send = setup({
    aggregate(pipeline) {
      pipelines.push(pipeline);
      return [{ data, count: [{ total: 1 }] }];
    },
  });
  const result = await send(
    'get',
    '/api/admin/interests?interest=Chess',
  ).expect(200);
  assert.deepEqual(result.body, { data, page: 1, limit: 20, total: 1 });
  assert.equal(pipelines.length, 1);
  assert.deepEqual(pipelines[0][0], { $match: { interests: 'chess' } });
  const unwind = pipelines[0].findIndex((stage) => '$unwind' in stage);
  assert.deepEqual(pipelines[0][unwind + 1], {
    $match: { interests: 'chess' },
  });
});
