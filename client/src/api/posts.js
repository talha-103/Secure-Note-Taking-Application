export const listPosts = (http, author, page, signal) =>
  http(
    '/posts?' + new URLSearchParams({ page, ...(author && { email: author }) }),
    {
      signal,
    },
  );
export const publishPost = (http, body) =>
  http('/posts', { method: 'POST', body });
