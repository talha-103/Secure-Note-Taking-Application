import { z } from 'zod';
import { registerSchema } from '../auth/auth.schema.js';
import { paginationSchema } from '../../utils/paginate.js';

export const userIdSchema = z.strictObject({
  id: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid ID'),
});
export const createUserSchema = z.strictObject({
  ...registerSchema.shape,
  role: z.enum(['user', 'admin']).optional(),
});
export const updateUserSchema = createUserSchema
  .partial()
  .refine((fields) => Object.keys(fields).length > 0, 'No changes supplied');
export const interestQuerySchema = paginationSchema.extend({
  interest: z.string().trim().min(1).max(80).toLowerCase().optional(),
});
