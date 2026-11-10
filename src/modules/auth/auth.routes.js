import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { createAuthController } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schema.js';

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
  return router;
}
