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

test('shows a required name field on the registration route', async () => {
  renderAt('/register');
  expect(await screen.findByLabelText('Name')).toBeRequired();
  expect(screen.getByLabelText('Email')).toBeRequired();
  expect(screen.getByRole('link', { name: 'Sign in instead' })).toHaveAttribute(
    'href',
    '/login',
  );
});

test('renders All Notes with author names and emails in a table', async () => {
  localStorage.setItem(key, 'admin-token');
  global.fetch = jest.fn(async (path) =>
    path === '/api/me'
      ? response(200, { ...user, name: 'Admin', role: 'admin' })
      : response(200, {
          data: [
            {
              _id: 'note-id',
              owner: 'owner-id',
              title: 'Example',
              content: 'Body',
              ownerProfile: { name: 'Taylor', email: 'taylor@example.com' },
            },
          ],
          page: 1,
          limit: 20,
          total: 1,
        }),
  );
  renderAt('/admin/notes');
  await screen.findByRole('table');
  expect(
    screen.getAllByRole('columnheader').map((header) => header.textContent),
  ).toEqual(['Title', 'Content', 'Name', 'Email']);
  expect(screen.getByRole('cell', { name: 'Taylor' })).toBeInTheDocument();
  expect(
    screen.getByRole('cell', { name: 'taylor@example.com' }),
  ).toBeInTheDocument();
  expect(screen.queryByText('owner-id')).not.toBeInTheDocument();
});

test('lets an admin change the password of an existing user without a name', async () => {
  localStorage.setItem(key, 'admin-token');
  const account = { ...user, _id: 'legacy-user', interests: [] };
  global.fetch = jest.fn(async (path, options) => {
    if (path === '/api/me') return response(200, { ...user, role: 'admin' });
    if (options.method === 'PATCH') return response(200, account);
    return response(200, { data: [account], page: 1, limit: 20, total: 1 });
  });
  renderAt('/admin/users');
  fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
  expect(screen.getByLabelText('Name')).not.toBeRequired();
  fireEvent.change(screen.getByLabelText('New password (optional)'), {
    target: { value: 'New password 123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save user' }));
  await waitFor(() => {
    const [path, options] =
      global.fetch.mock.calls.find(([, input]) => input.method === 'PATCH') ??
      [];
    expect(path).toBe('/api/admin/users/legacy-user');
    expect(JSON.parse(options.body)).toEqual({
      email: account.email,
      interests: [],
      role: 'user',
      password: 'New password 123',
    });
  });
});

test('routes an initial admin through password setup before opening admin pages', async () => {
  localStorage.setItem(key, 'setup-token');
  const admin = { ...user, role: 'admin', mustChangePassword: true };
  global.fetch = jest.fn(async (path) => {
    if (path === '/api/me') return response(200, admin);
    if (path === '/api/auth/initial-password') {
      return response(200, {
        token: 'new-token',
        user: { ...admin, mustChangePassword: false },
      });
    }
    return response(200, { data: [], page: 1, limit: 20, total: 0 });
  });
  renderAt('/admin/users');
  await screen.findByRole('heading', {
    name: 'Change your initial email and password',
  });
  expect(global.fetch).not.toHaveBeenCalledWith(
    '/api/admin/users?page=1',
    expect.anything(),
  );
  fireEvent.change(screen.getByLabelText('New email'), {
    target: { value: 'new-admin@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Current password'), {
    target: { value: 'temporary password' },
  });
  fireEvent.change(screen.getByLabelText('New password', { exact: true }), {
    target: { value: 'replacement password' },
  });
  fireEvent.change(screen.getByLabelText('Confirm new password'), {
    target: { value: 'replacement password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save new credentials' }));
  await screen.findByRole('heading', { name: 'My notes' });
  expect(localStorage.getItem(key)).toBe('new-token');
  const [, options] = global.fetch.mock.calls.find(
    ([path]) => path === '/api/auth/initial-password',
  );
  expect(JSON.parse(options.body).newEmail).toBe('new-admin@example.com');
});
