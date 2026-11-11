import { Router } from 'express';
import { email } from '../auth/auth.schema.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { paginationSchema } from '../../utils/paginate.js';
import { userIdSchema } from '../users/users.schema.js';
import { createPostsController } from './posts.controller.js';
import { postBodySchema } from './posts.schema.js';

/** Registers authenticated post publishing and browsing endpoints. */
export function createPostsRouter(auth, posts) {
  const router = Router();
  const controller = createPostsController(posts);
  const signedIn = requireAuth(auth);
  router.get(
    '/posts',
    signedIn,
    validate({ query: paginationSchema.extend({ email }) }),
    controller.listByEmail,
  );
  router.post(
    '/posts',
    signedIn,
    validate({ body: postBodySchema }),
    controller.add,
  );
  router.get(
    '/users/:id/posts',
    signedIn,
    validate({ params: userIdSchema, query: paginationSchema }),
    controller.listByAuthor,
  );
  return router;
}
