export const signIn = (http, body) =>
  http('/auth/login', { method: 'POST', body });
export const register = (http, body) =>
  http('/auth/register', { method: 'POST', body });
