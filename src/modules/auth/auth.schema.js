import { z } from 'zod';

const password = z.string().min(8).max(256);
export const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const interests = z
  .array(z.string().trim().min(1).max(80).toLowerCase())
  .max(25)
  .transform((values) => [...new Set(values)]);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  password,
  interests: interests.optional(),
});
export const initialPasswordSchema = z.strictObject({
  currentPassword: z.string().min(1).max(256),
  newPassword: password,
});
export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(256),
});
