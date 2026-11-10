import { z } from 'zod';

export const noteIdSchema = z.strictObject({
  id: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid ID'),
});

export const noteBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(20000).default(''),
});
