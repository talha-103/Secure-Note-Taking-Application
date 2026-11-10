import { createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import bcrypt from 'bcrypt';

const derive = promisify(scrypt);
const prefix = 'bcrypt-sha256:';

// Prehash to preserve the entire password even above bcrypt's 72-byte input limit.
const digest = (password) =>
  createHash('sha256').update(password).digest('base64');

/** Hashes a password with bcrypt cost 12. */
export async function hashPassword(password) {
  return prefix + (await bcrypt.hash(digest(password), 12));
}

/** Checks a bcrypt hash or a legacy scrypt hash from an existing account. */
export async function verifyPassword(password, hash) {
  if (hash.startsWith(prefix))
    return bcrypt.compare(digest(password), hash.slice(prefix.length));
  if (/^\$2[aby]\$/.test(hash)) return bcrypt.compare(password, hash);
  if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash)) return false;
  const [salt, key] = hash.split(':');
  return timingSafeEqual(
    await derive(password, salt, 64),
    Buffer.from(key, 'hex'),
  );
}

/** Identifies the original scrypt format for upgrade after authentication. */
export function isLegacyPasswordHash(hash) {
  return /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash);
}
