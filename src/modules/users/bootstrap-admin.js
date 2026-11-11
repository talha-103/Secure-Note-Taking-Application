import { registerSchema } from '../auth/auth.schema.js';
import { hashPassword } from '../auth/password.js';
import { users } from './users.service.js';

/** Creates the initial admin once using credentials supplied by the operator. */
export async function ensureInitialAdmin(
  source = process.env,
  accounts = users,
) {
  if (await accounts.hasAdmin()) return false;
  if (!source.ADMIN_EMAIL && !source.ADMIN_PASSWORD) return false;

  const parsed = registerSchema.safeParse({
    name: source.ADMIN_NAME || 'Administrator',
    email: source.ADMIN_EMAIL,
    password: source.ADMIN_PASSWORD,
  });
  if (!parsed.success) {
    throw new Error(
      'Set a valid ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD (8 to 256 characters)',
    );
  }

  const { name, email, password } = parsed.data;
  try {
    await accounts.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role: 'admin',
      mustChangePassword: true,
    });
    return true;
  } catch (error) {
    if (error.code !== 11000) throw error;
    if (await accounts.hasAdmin()) return false;
    throw new Error(
      'ADMIN_EMAIL belongs to an existing user. Configure a different email',
    );
  }
}
