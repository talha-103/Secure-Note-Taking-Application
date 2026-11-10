import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { paginationSchema } from '../../utils/paginate.js';
import { createNotesController } from './notes.controller.js';
import { noteIdSchema, noteBodySchema } from './notes.schema.js';

/** Registers owned note endpoints and the admin-wide read-only list. */
export function createNotesRouter(auth, notes) {
  const router = Router();
  const controller = createNotesController(notes);
  const signedIn = requireAuth(auth);
  router.get(
    '/notes',
    signedIn,
    validate({ query: paginationSchema }),
    controller.listOwn,
  );
  router.post(
    '/notes',
    signedIn,
    validate({ body: noteBodySchema }),
    controller.add,
  );
  router.get(
    '/notes/:id',
    signedIn,
    validate({ params: noteIdSchema }),
    controller.get,
  );
  router.put(
    '/notes/:id',
    signedIn,
    validate({ params: noteIdSchema, body: noteBodySchema }),
    controller.update,
  );
  router.delete(
    '/notes/:id',
    signedIn,
    validate({ params: noteIdSchema }),
    controller.remove,
  );
  router.get(
    '/admin/notes',
    signedIn,
    requireRole('admin'),
    validate({ query: paginationSchema }),
    controller.listAll,
  );
  return router;
}
