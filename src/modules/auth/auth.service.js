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
    const {
      _id,
      name = '',
      email,
      role,
      interests,
      mustChangePassword = false,
    } = user;
    const token = jwt.sign(
      mustChangePassword ? { setup: true } : {},
      JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: String(_id),
        expiresIn: JWT_EXPIRES_IN,
      },
    );
    return {
      user: { _id, name, email, role, interests, mustChangePassword },
      token,
    };
  }

  return {
    async register({ name, email, password, interests }) {
      return session(
        await accounts.create({
          name,
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
    async changeInitialPassword(user, { currentPassword, newPassword }) {
      if (!user.mustChangePassword)
        throw new ApiError(409, 'Initial password setup is already complete');
      const account = await accounts.findCredentials(user.email);
      if (
        !account ||
        String(account._id) !== String(user._id) ||
        !(await verifyPassword(currentPassword, account.passwordHash))
      ) {
        throw new ApiError(400, 'Current password is incorrect');
      }
      if (await verifyPassword(newPassword, account.passwordHash)) {
        throw new ApiError(400, 'Choose a different password');
      }
      const updated = await accounts.completePasswordSetup(
        user._id,
        account.passwordHash,
        await hashPassword(newPassword),
      );
      if (!updated)
        throw new ApiError(
          409,
          'Password changed. Sign in again and retry if needed',
        );
      return session(updated);
    },
    async authenticate(token) {
      let claims;
      try {
        claims = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      } catch {
        throw new ApiError(401, 'Invalid or expired token');
      }
      const subject = claims?.sub;
      if (typeof subject !== 'string' || !/^[a-f0-9]{24}$/i.test(subject)) {
        throw new ApiError(401, 'Invalid or expired token');
      }
      const user = await accounts.findById(subject);
      if (!user) throw new ApiError(401, 'Authentication required');
      if (Boolean(claims.setup) !== Boolean(user.mustChangePassword)) {
        throw new ApiError(401, 'Sign in again');
      }
      return user;
    },
  };
}
