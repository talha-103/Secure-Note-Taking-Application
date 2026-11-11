export const signIn = (http, body) =>
  http('/auth/login', { method: 'POST', body });
export const register = (http, body) =>
  http('/auth/register', { method: 'POST', body });

/** Replaces the bootstrap password and returns an unrestricted session. */
export const changeInitialPassword = (http, body) =>
  http('/auth/initial-password', { method: 'POST', body });
