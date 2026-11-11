import { useState } from 'react';
import { listUsers, saveUser, deleteUser } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import PagedList from '../../components/PagedList';
import { parseInterests } from '../../components/parseInterests';
import { useAction } from '../../components/useAction';
import { usePage } from '../../components/usePage';

const emptyUser = {
  name: '',
  email: '',
  password: '',
  interests: '',
  role: 'user',
};

export default function UsersPage() {
  const { user, http } = useAuth();
  const [editing, setEditing] = useState(emptyUser);
  const listing = usePage(listUsers);
  const { busy, error, run } = useAction();
  const change = (key) => (event) =>
    setEditing({ ...editing, [key]: event.target.value });
  const ownAccount = editing._id === user._id;

  return (
    <section>
      <h2>Manage users</h2>
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          run(async () => {
            const { _id, name, email, password, role, interests } = editing;
            const body = { name, email, interests: parseInterests(interests) };
            if (password || !_id) body.password = password;
            if (!ownAccount) body.role = role;
            await saveUser(http, _id, body);
            if (!_id) listing.setPage(1);
            setEditing(emptyUser);
            listing.refresh();
          });
        }}
      >
        <p>
          <label>
            Name{' '}
            <input
              required
              maxLength={100}
              value={editing.name}
              onChange={change('name')}
            />
          </label>
        </p>
        <p>
          <label>
            Email{' '}
            <input
              type="email"
              required
              value={editing.email}
              onChange={change('email')}
            />
          </label>
        </p>
        <p>
          <label>
            {editing._id ? 'New password (optional)' : 'Password'}{' '}
            <input
              type="password"
              minLength={8}
              required={!editing._id}
              value={editing.password}
              onChange={change('password')}
            />
          </label>
        </p>
        <p>
          <label>
            Interests (comma separated){' '}
            <input value={editing.interests} onChange={change('interests')} />
          </label>
        </p>
        <p>
          <label>
            Role{' '}
            <select
              disabled={ownAccount}
              value={editing.role}
              onChange={change('role')}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </p>
        <button disabled={busy}>
          {editing._id ? 'Save user' : 'Add user'}
        </button>
        {editing._id && (
          <button type="button" onClick={() => setEditing(emptyUser)}>
            Cancel edit
          </button>
        )}
      </form>
      <PagedList
        listing={listing}
        columns={['Name', 'Email', 'Role', 'Interests', 'Actions']}
        renderItem={(item) => (
          <tr key={item._id}>
            <td>{item.name || '—'}</td>
            <td>{item.email}</td>
            <td>{item.role}</td>
            <td>{item.interests.join(', ') || '—'}</td>
            <td>
              <button
                disabled={busy}
                onClick={() =>
                  setEditing({
                    ...item,
                    name: item.name || '',
                    interests: item.interests.join(', '),
                    password: '',
                  })
                }
              >
                Edit
              </button>
              {item._id !== user._id && (
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await deleteUser(http, item._id);
                      if (editing._id === item._id) setEditing(emptyUser);
                      if (listing.result.data.length === 1 && listing.page > 1)
                        listing.setPage(listing.page - 1);
                      listing.refresh();
                    })
                  }
                >
                  Delete
                </button>
              )}
            </td>
          </tr>
        )}
      />
    </section>
  );
}
