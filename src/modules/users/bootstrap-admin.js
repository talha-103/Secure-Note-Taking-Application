import { readCommonConfig } from '../../config/common.js';
import { registerSchema } from '../auth/auth.schema.js';
import { hashPassword } from '../auth/password.js';
import { users } from './users.service.js';

/** Creates the initial admin once using credentials supplied by the operator. */
export async function ensureInitialAdmin(source, accounts = users) {
  if (await accounts.hasAdmin()) return false;
  const config = source ?? (await readCommonConfig());
  if (!config.ADMIN_EMAIL && !config.ADMIN_PASSWORD) return false;

  const parsed = registerSchema.safeParse({
    name: config.ADMIN_NAME || 'Administrator',
    email: config.ADMIN_EMAIL,
    password: config.ADMIN_PASSWORD,
  });
  if (!parsed.success) {
    throw new Error(
      'Set a valid admin name, email, and password (8 to 256 characters) in src/config/common.local.json',
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
