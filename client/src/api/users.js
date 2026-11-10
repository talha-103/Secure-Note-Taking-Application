export const profile = (http, signal) => http('/me', { signal });
export const listUsers = (http, page, signal) =>
  http('/admin/users?page=' + page, { signal });
export const listInterests = (http, page, signal) =>
  http('/admin/interests?page=' + page, { signal });
export const saveUser = (http, id, body) =>
  http('/admin/users' + (id ? '/' + id : ''), {
    method: id ? 'PATCH' : 'POST',
    body,
  });
export const deleteUser = (http, id) =>
  http('/admin/users/' + id, { method: 'DELETE' });
