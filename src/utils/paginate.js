import { z } from 'zod';

const page = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(100000));
const limit = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(100));

export const paginationSchema = z.strictObject({
  page: page.default(1),
  limit: limit.default(20),
});

/** Returns the database offset for validated pagination input. */
export function pageOffset({ page, limit }) {
  return (page - 1) * limit;
}

/** Builds the standard list response. */
export function pageResult(data, { page, limit }, total) {
  return { data, page, limit, total };
}
