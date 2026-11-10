import { ApiError } from '../utils/ApiError.js';

/** Restricts an authenticated route to the supplied role. */
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role)
      return next(new ApiError(403, 'Access denied'));
    next();
  };
}
