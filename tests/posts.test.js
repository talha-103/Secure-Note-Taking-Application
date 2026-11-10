import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createPostsService } from '../src/modules/posts/posts.service.js';

const env = {
  JWT_SECRET: 'test secret used only by the posts tests',
  JWT_EXPIRES_IN: 60,
};
const viewer = '5f53fe68d17a92590c842811';
const author = '5f53fe68d17a92590c842812';

function setup(aggregate) {
  const posts = createPostsService(
    { aggregate },
    {
      collection: { name: 'posts' },
      create: (fields) => fields,
    },
  );
  const api = request(
    createApp({
      env,
      accountStore: { findById: async (_id) => ({ _id, role: 'user' }) },
      postService: posts,
    }),
  );
  const token = jwt.sign({}, env.JWT_SECRET, { subject: viewer });
  return {
    api,
    signedIn: (method, path) =>
      api[method](path).set('Authorization', 'Bearer ' + token),
  };
}

test('requires sign-in and paginates another author’s posts using a single lookup', async () => {
  const data = [{ author, title: 'Post' }];
  const pipelines = [];
  const { api, signedIn } = setup((pipeline) => {
    pipelines.push(pipeline);
    return [{ posts: [{ data, count: [{ total: 3 }] }] }];
  });
  const path = '/api/users/' + author + '/posts';
  await api.get(path).expect(401);
  await signedIn('get', path + '?limit=101').expect(400);
  await signedIn('get', '/api/users/bad/posts').expect(400);
  assert.equal(pipelines.length, 0);
  const response = await signedIn('get', path + '?page=2&limit=1').expect(200);
  assert.deepEqual(response.body, { data, page: 2, limit: 1, total: 3 });
  assert.equal(pipelines.length, 1);
  assert.equal(String(pipelines[0][0].$match._id), author);
  const lookup = pipelines[0].find((stage) => stage.$lookup).$lookup;
  assert.equal(lookup.from, 'posts');
  assert.equal(lookup.localField, '_id');
  assert.equal(lookup.foreignField, 'author');
  assert.deepEqual(lookup.pipeline, [
    { $sort: { _id: -1 } },
    {
      $facet: {
        data: [{ $skip: 1 }, { $limit: 1 }],
        count: [{ $count: 'total' }],
      },
    },
  ]);
});

test('distinguishes a missing author from an author without posts', async () => {
  const path = '/api/users/' + author + '/posts';
  await setup(() => [])
    .signedIn('get', path)
    .expect(404);
  const response = await setup(() => [{ posts: [{ data: [], count: [] }] }])
    .signedIn('get', path)
    .expect(200);
  assert.deepEqual(response.body, { data: [], page: 1, limit: 20, total: 0 });
});

test('assigns the authenticated author and validates the publishing payload', async () => {
  const { api, signedIn } = setup();
  await api.post('/api/posts').send({ title: 'Post' }).expect(401);
  await signedIn('post', '/api/posts').send({ title: ' ' }).expect(400);
  const response = await signedIn('post', '/api/posts')
    .send({ title: ' Post ', author })
    .expect(201);
  assert.deepEqual(response.body, {
    title: 'Post',
    content: '',
    author: viewer,
  });
});
