/** Converts route and parser failures to consistent JSON responses. */
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 11000)
    return res.status(409).json({ error: 'Email already exists' });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res
    .status(status)
    .json({ error: status >= 500 ? 'Internal server error' : error.message });
}
