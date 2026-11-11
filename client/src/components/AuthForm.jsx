import { Link, Navigate } from 'react-router-dom';
import { register, signIn } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { parseInterests } from './parseInterests';
import { useAction } from './useAction';

export default function AuthForm({ creating = false }) {
  const { user, http, loading, startSession } = useAuth();
  const { busy, error, run } = useAction();

  if (loading) return <p>Checking session…</p>;
  if (user)
    return (
      <Navigate
        to={user.mustChangePassword ? '/change-password' : '/notes'}
        replace
      />
    );

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <h2 id="auth-title">{creating ? 'Create an account' : 'Sign in'}</h2>
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          const credentials = {
            email: fields.get('email'),
            password: fields.get('password'),
          };
          run(async () => {
            const session = creating
              ? await register(http, {
                  ...credentials,
                  name: fields.get('name'),
                  interests: parseInterests(fields.get('interests')),
                })
              : await signIn(http, credentials);
            startSession(session);
          });
        }}
      >
        {creating && (
          <label>
            Name
            <input name="name" autoComplete="name" required maxLength={100} />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={creating ? 'new-password' : 'current-password'}
            required
            minLength={creating ? 8 : 1}
            maxLength={256}
          />
        </label>
        {creating && (
          <label>
            Interests (optional, comma separated)
            <input name="interests" />
          </label>
        )}
        <button disabled={busy}>{creating ? 'Register' : 'Sign in'}</button>
      </form>
      {creating ? (
        <Link to="/login">Sign in instead</Link>
      ) : (
        <Link to="/register">Create an account</Link>
      )}
    </section>
  );
}
