import { z } from 'zod';

export const postBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(20000).default(''),
});
