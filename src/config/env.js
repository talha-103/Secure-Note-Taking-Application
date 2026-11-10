import { z } from 'zod';

const schema = z.object({
  JWT_SECRET: z
    .string()
    .refine((value) => Buffer.byteLength(value) >= 32, 'Use at least 32 bytes'),
  JWT_EXPIRES_IN: z.coerce.number().int().positive().default(3600),
  MONGODB_URI: z
    .string()
    .min(1)
    .default('mongodb://127.0.0.1:27017/secure_notes'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
});

/** Validates server configuration and returns typed values. */
export function readEnv(source = process.env) {
  return schema.parse(source);
}
