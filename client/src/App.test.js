import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

const key = 'secure-notes.jwt';
const user = {
  _id: '5f53fe68d17a92590c842811',
  email: 'user@example.com',
  role: 'user',
};
const originalFetch = global.fetch;

function response(status, body) {
  return { status, ok: status < 400, json: async () => body };
}

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

afterEach(() => {
  localStorage.clear();
  global.fetch = originalFetch;
});

test('redirects a visitor to sign-in when opening a protected route', async () => {
  renderAt('/posts');
  expect(
    await screen.findByRole('heading', { name: 'Sign in' }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Posts' })).not.toBeInTheDocument();
});

test('restores a session, guards admin routes, and sends the JWT on paginated requests', async () => {
  localStorage.setItem(key, 'saved-token');
  global.fetch = jest.fn(async (path) => {
    if (path === '/api/me') return response(200, user);
    const page = path.endsWith('page=2') ? 2 : 1;
    return response(200, { data: [], page, limit: 1, total: 2 });
  });

  renderAt('/admin/users');
  expect(
    await screen.findByRole('heading', { name: 'My notes' }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
  await screen.findByText('Page 2');
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/notes?page=2',
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer saved-token' }),
    }),
  );
  expect(global.fetch).not.toHaveBeenCalledWith(
    '/api/admin/users?page=1',
    expect.anything(),
  );
});

test('clears the stored JWT and redirects to sign-in on a protected request returning 401', async () => {
  localStorage.setItem(key, 'expired-token');
  global.fetch = jest.fn(async (path) =>
    path === '/api/me'
      ? response(200, user)
      : response(401, { error: 'Expired token' }),
  );

  renderAt('/notes');
  expect(
    await screen.findByRole('heading', { name: 'Sign in' }),
  ).toBeInTheDocument();
  await waitFor(() => expect(localStorage.getItem(key)).toBeNull());
});
