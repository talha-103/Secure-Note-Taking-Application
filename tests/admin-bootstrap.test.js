import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { ensureInitialAdmin } from '../src/modules/users/bootstrap-admin.js';

const id = '5f53fe68d17a92590c842811';
const env = {
  JWT_SECRET: 'test secret only for admin setup tests',
  JWT_EXPIRES_IN: 60,
};
const config = {
  ADMIN_NAME: 'First Admin',
  ADMIN_EMAIL: 'ADMIN@example.test',
  ADMIN_PASSWORD: 'temporary password',
};

test('bootstraps once and requires password replacement before admin access', async () => {
  let account;
  const accounts = {
    hasAdmin: () => Boolean(account),
    create: (fields) => {
      account = { _id: id, ...fields };
    },
    findCredentials: (email) => (account?.email === email ? account : null),
    findById: (subject) => (subject === id ? account : null),
    completePasswordSetup: (subject, oldHash, credentials) => {
      if (credentials.email === 'taken@example.test')
        throw Object.assign(new Error('Duplicate email'), { code: 11000 });
      if (
        subject !== id ||
        account.passwordHash !== oldHash ||
        !account.mustChangePassword
      )
        return null;
      account = {
        ...account,
        ...credentials,
        mustChangePassword: false,
      };
      return account;
    },
  };
  assert.equal(await ensureInitialAdmin({}, accounts), false);
  assert.equal(await ensureInitialAdmin(config, accounts), true);
  const initialHash = account.passwordHash;
  assert.notEqual(initialHash, config.ADMIN_PASSWORD);
  assert.equal(
    await ensureInitialAdmin(
      { ...config, ADMIN_PASSWORD: 'other temporary password' },
      accounts,
    ),
    false,
  );
  assert.equal(account.passwordHash, initialHash);

  const api = request(
    createApp({
      env,
      accountStore: accounts,
      userService: { list: async () => ({ data: [] }) },
    }),
  );
  const initialEmail = account.email;
  const newEmail = 'permanent@example.test';
  const login = (password, email = initialEmail) =>
    api.post('/api/auth/login').send({ email, password });
  const session = (await login(config.ADMIN_PASSWORD).expect(200)).body;
  assert.equal(session.user.mustChangePassword, true);
  assert.equal(session.user.name, config.ADMIN_NAME);
  const setupToken = 'Bearer ' + session.token;
  await api.get('/api/me').set('Authorization', setupToken).expect(200);
  await api
    .get('/api/admin/users')
    .set('Authorization', setupToken)
    .expect(403);
  await api.get('/api/notes').set('Authorization', setupToken).expect(403);

  const change = (currentPassword, email = newEmail) =>
    api
      .post('/api/auth/initial-password')
      .set('Authorization', setupToken)
      .send({
        currentPassword,
        newEmail: email,
        newPassword: 'replacement password',
      });
  await change('wrong password').expect(400);
  await change(config.ADMIN_PASSWORD, initialEmail.toUpperCase()).expect(400);
  await change(config.ADMIN_PASSWORD, 'taken@example.test').expect(409);
  assert.equal(account.email, initialEmail);
  assert.equal(account.passwordHash, initialHash);
  const completed = (await change(config.ADMIN_PASSWORD).expect(200)).body;
  assert.equal(completed.user.mustChangePassword, false);
  assert.equal(completed.user.email, newEmail);
  await api
    .get('/api/admin/users')
    .set('Authorization', 'Bearer ' + completed.token)
    .expect(200);
  await api.get('/api/me').set('Authorization', setupToken).expect(401);
  await login(config.ADMIN_PASSWORD).expect(401);
  await login('replacement password').expect(401);
  await login(config.ADMIN_PASSWORD, newEmail).expect(401);
  await login('replacement password', newEmail).expect(200);
});
