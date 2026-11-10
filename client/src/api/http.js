export function createHttp(token, onUnauthorized) {
  return async function request(path, { method = 'GET', body, signal } = {}) {
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch('/api' + path, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 401 && token) onUnauthorized(token);
    if (response.status === 204) return undefined;
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || 'Request failed');
    if (!data) throw new Error('Invalid server response');
    return data;
  };
}
