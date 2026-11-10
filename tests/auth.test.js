import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../src/app.js';

const userId = '5f53fe68d17a92590c842811';
const env = {
  JWT_SECRET: 'test secret used only by the auth tests',
  JWT_EXPIRES_IN: 120,
};

function setup() {
  const users = new Map();
  const app = createApp({
    env,
    accountStore: {
      async create(fields) {
        const user = { _id: userId, role: 'user', interests: [], ...fields };
        users.set(user.email, user);
        return user;
      },
      async findCredentials(email) {
        return users.get(email);
      },
      async findById(id) {
        return [...users.values()].find((user) => user._id === id);
      },
      async replacePasswordHash(id, previous, replacement) {
        for (const user of users.values()) {
          if (user._id === id && user.passwordHash === previous)
            user.passwordHash = replacement;
        }
      },
    },
  });
  return { api: request(app), users };
}

test('registers a user with bcrypt and issues a token using the configured expiry', async () => {
  const { api, users } = setup();
  const password = 'a'.repeat(72) + 'correct suffix';
  const result = await api
    .post('/api/auth/register')
    .send({
      email: ' USER@example.com ',
      password,
      role: 'admin',
    })
    .expect(201);
  assert.equal(result.body.user.role, 'user');
  assert.equal(result.body.user.email, 'user@example.com');
  assert.equal(result.body.user.passwordHash, undefined);
  assert.match(
    users.get('user@example.com').passwordHash,
    /^bcrypt-sha256:\$2b\$12\$/,
  );
  const { iat, exp } = jwt.verify(result.body.token, env.JWT_SECRET);
  assert.equal(exp - iat, 120);

  const profile = await api
    .get('/api/me')
    .set('Authorization', 'Bearer ' + result.body.token)
    .expect(200);
  assert.equal(profile.body.passwordHash, undefined);
  await api
    .get('/api/admin/users')
    .set('Authorization', 'Bearer ' + result.body.token)
    .expect(403);
  const wrong = await api
    .post('/api/auth/login')
    .send({
      email: 'user@example.com',
      password: 'a'.repeat(72) + 'different suffix',
    })
    .expect(401);
  const unknown = await api
    .post('/api/auth/login')
    .send({
      email: 'unknown@example.com',
      password,
    })
    .expect(401);
  assert.deepEqual(wrong.body, unknown.body);
});

test('upgrades an existing scrypt credential on login', async () => {
  const { api, users } = setup();
  const email = 'legacy@example.com';
  const password = 'legacy password';
  const salt = 'a'.repeat(32);
  users.set(email, {
    _id: userId,
    email,
    role: 'user',
    interests: [],
    passwordHash: salt + ':' + scryptSync(password, salt, 64).toString('hex'),
  });
  await api.post('/api/auth/login').send({ email, password }).expect(200);
  assert.match(users.get(email).passwordHash, /^bcrypt-sha256:/);
  await api.post('/api/auth/login').send({ email, password }).expect(200);
});

test('rejects invalid registration and missing or expired tokens', async () => {
  const { api } = setup();
  await api
    .post('/api/auth/register')
    .send({ email: 'invalid', password: 'short' })
    .expect(400);
  await api.get('/api/me').expect(401);
  const expired = jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    expiresIn: -1,
  });
  await api
    .get('/api/me')
    .set('Authorization', 'Bearer ' + expired)
    .expect(401);
});
