export const listPosts = (http, author, page, signal) =>
  http('/users/' + encodeURIComponent(author) + '/posts?page=' + page, {
    signal,
  });
export const publishPost = (http, body) =>
  http('/posts', { method: 'POST', body });
