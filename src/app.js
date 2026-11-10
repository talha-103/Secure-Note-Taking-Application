import express from 'express';
import { fileURLToPath } from 'node:url';
import { users } from './modules/users/users.service.js';
import { createUsersRouter } from './modules/users/users.routes.js';
import { readEnv } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createLegacyRouter } from './legacy.routes.js';

/** Creates the Express app without opening a network listener. */
export function createApp({
  env = readEnv(),
  accountStore = users,
  userService = users,
} = {}) {
  const app = express();
  const auth = createAuthService(accountStore, env);
  app.use(express.json({ limit: '64kb' }));
  app.use('/api/auth', createAuthRouter(auth));
  app.use('/api', createUsersRouter(auth, userService));
  app.use('/api', createLegacyRouter(auth, userService));
  app.use('/api', (req, res) =>
    res.status(404).json({ error: 'Endpoint not found' }),
  );
  app.use(
    express.static(fileURLToPath(new URL('../client/build/', import.meta.url))),
  );
  app.use(errorHandler);
  return app;
}
