export const listPosts = (http, author, page, signal) =>
  http('/posts?email=' + encodeURIComponent(author) + '&page=' + page, {
    signal,
  });
export const publishPost = (http, body) =>
  http('/posts', { method: 'POST', body });
