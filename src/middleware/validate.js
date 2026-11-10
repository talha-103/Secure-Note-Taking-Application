import { ApiError } from '../utils/ApiError.js';

/** Parses request inputs and stores sanitized values for the controller. */
export function validate(schemas) {
  return (req, res, next) => {
    req.input = {};
    for (const [key, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        const issue = result.error.issues[0];
        return next(
          new ApiError(
            400,
            [key, ...issue.path].join('.') + ': ' + issue.message,
          ),
        );
      }
      req.input[key] = result.data;
    }
    next();
  };
}
