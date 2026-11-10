import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { register, signIn } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { parseInterests } from '../components/parseInterests';
import { useAction } from '../components/useAction';

export default function SignInPage() {
  const { user, http, loading, startSession } = useAuth();
  const [creating, setCreating] = useState(false);
  const { busy, error, run, clearError } = useAction();

  if (loading) return <p>Checking session…</p>;
  if (user) return <Navigate to="/notes" replace />;

  return (
    <section>
      <h2>{creating ? 'Create an account' : 'Sign in'}</h2>
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
                  interests: parseInterests(fields.get('interests')),
                })
              : await signIn(http, credentials);
            startSession(session);
          });
        }}
      >
        <p>
          <label>
            Email <input name="email" type="email" required />
          </label>
        </p>
        <p>
          <label>
            Password{' '}
            <input
              name="password"
              type="password"
              required
              minLength={creating ? 8 : 1}
            />
          </label>
        </p>
        {creating && (
          <p>
            <label>
              Interests (comma separated) <input name="interests" />
            </label>
          </p>
        )}
        <button disabled={busy}>{creating ? 'Register' : 'Sign in'}</button>
      </form>
      <button
        disabled={busy}
        onClick={() => {
          setCreating(!creating);
          clearError();
        }}
      >
        {creating ? 'Use an existing account' : 'Register instead'}
      </button>
    </section>
  );
}
