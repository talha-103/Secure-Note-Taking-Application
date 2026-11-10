import jwt from 'jsonwebtoken';
import { ApiError } from '../../utils/ApiError.js';
import {
  hashPassword,
  verifyPassword,
  isLegacyPasswordHash,
} from './password.js';

const fallbackHash =
  'bcrypt-sha256:$2b$12$D4G5f18oD0ZqNTgcCE7YZ.VDrg/pXApJAdVwwvm8hpQZKybVD1jR2';

/** Builds account registration, login and token verification operations. */
export function createAuthService(accounts, { JWT_SECRET, JWT_EXPIRES_IN }) {
  function session(user) {
    const { _id, email, role, interests } = user;
    const token = jwt.sign({}, JWT_SECRET, {
      algorithm: 'HS256',
      subject: String(_id),
      expiresIn: JWT_EXPIRES_IN,
    });
    return { user: { _id, email, role, interests }, token };
  }

  return {
    async register({ email, password, interests }) {
      return session(
        await accounts.create({
          email,
          passwordHash: await hashPassword(password),
          interests,
        }),
      );
    },
    async login({ email, password }) {
      const user = await accounts.findCredentials(email);
      const stored = user?.passwordHash ?? fallbackHash;
      if (!(await verifyPassword(password, stored)) || !user) {
        throw new ApiError(401, 'Invalid credentials');
      }
      if (isLegacyPasswordHash(stored)) {
        await accounts.replacePasswordHash(
          user._id,
          stored,
          await hashPassword(password),
        );
      }
      return session(user);
    },
    async authenticate(token) {
      let subject;
      try {
        subject = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }).sub;
      } catch {
        throw new ApiError(401, 'Invalid or expired token');
      }
      if (typeof subject !== 'string' || !/^[a-f0-9]{24}$/i.test(subject)) {
        throw new ApiError(401, 'Invalid or expired token');
      }
      const user = await accounts.findById(subject);
      if (!user) throw new ApiError(401, 'Authentication required');
      return user;
    },
  };
}
