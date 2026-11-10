import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { paginationSchema } from '../../utils/paginate.js';
import { createUsersController } from './users.controller.js';
import {
  createUserSchema,
  interestQuerySchema,
  updateUserSchema,
  userIdSchema,
} from './users.schema.js';

/** Registers profile, admin user management, and interest group endpoints. */
export function createUsersRouter(auth, users) {
  const router = Router();
  const controller = createUsersController(users);
  const signedIn = requireAuth(auth);
  const admin = [signedIn, requireRole('admin')];

  router.get('/me', signedIn, controller.profile);
  router.get(
    '/admin/users',
    admin,
    validate({ query: paginationSchema }),
    controller.list,
  );
  router.post(
    '/admin/users',
    admin,
    validate({ body: createUserSchema }),
    controller.add,
  );
  router.get(
    '/admin/users/:id',
    admin,
    validate({ params: userIdSchema }),
    controller.get,
  );
  router.patch(
    '/admin/users/:id',
    admin,
    validate({ params: userIdSchema, body: updateUserSchema }),
    controller.update,
  );
  router.delete(
    '/admin/users/:id',
    admin,
    validate({ params: userIdSchema }),
    controller.remove,
  );
  router.get(
    '/admin/interests',
    admin,
    validate({ query: interestQuerySchema }),
    controller.interests,
  );
  return router;
}
