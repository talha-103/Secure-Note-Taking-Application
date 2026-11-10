import { ApiError } from '../utils/ApiError.js';

/** Verifies the token and loads the current account before allowing access. */
export function requireAuth(auth) {
  return async (req, res, next) => {
    const token = /^Bearer (\S+)$/i.exec(req.get('authorization') || '')?.[1];
    if (!token) throw new ApiError(401, 'Authentication required');
    req.user = await auth.authenticate(token);
    next();
  };
}
