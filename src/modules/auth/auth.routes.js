import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { createAuthController } from './auth.controller.js';
import {
  loginSchema,
  registerSchema,
  initialPasswordSchema,
} from './auth.schema.js';

/** Registers the public authentication endpoints. */
export function createAuthRouter(auth) {
  const router = Router();
  const controller = createAuthController(auth);
  router.post(
    '/register',
    validate({ body: registerSchema }),
    controller.register,
  );
  router.post('/login', validate({ body: loginSchema }), controller.login);
  router.post(
    '/initial-password',
    requireAuth(auth, { allowPasswordSetup: true }),
    validate({ body: initialPasswordSchema }),
    controller.changeInitialPassword,
  );
  return router;
}
