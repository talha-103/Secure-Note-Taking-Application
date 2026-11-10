export const listNotes = (http, page, signal) =>
  http('/notes?page=' + page, { signal });
export const listAllNotes = (http, page, signal) =>
  http('/admin/notes?page=' + page, { signal });
export const saveNote = (http, id, body) =>
  http('/notes' + (id ? '/' + id : ''), {
    method: id ? 'PUT' : 'POST',
    body,
  });
export const deleteNote = (http, id) =>
  http('/notes/' + id, { method: 'DELETE' });
