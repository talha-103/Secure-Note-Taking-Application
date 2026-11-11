import { Navigate } from 'react-router-dom';
import { changeInitialPassword } from '../api/auth';
import { useAction } from '../components/useAction';
import { useAuth } from '../context/AuthContext';

/** Collects replacements for the bootstrap admin's initial email and password. */
export default function ChangePasswordPage() {
  const { user, loading, http, startSession } = useAuth();
  const { busy, error, run } = useAction();
  if (loading) return <p>Checking session…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword) return <Navigate to="/notes" replace />;

  return (
    <section className="auth-panel" aria-labelledby="password-title">
      <h2 id="password-title">Change your initial email and password</h2>
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          run(async () => {
            const currentPassword = fields.get('currentPassword');
            const newPassword = fields.get('newPassword');
            if (newPassword !== fields.get('confirmation'))
              throw new Error('New passwords do not match');
            startSession(
              await changeInitialPassword(http, {
                currentPassword,
                newEmail: fields.get('newEmail'),
                newPassword,
              }),
            );
          });
        }}
      >
        <label>
          New email
          <input
            name="newEmail"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        <label>
          Current password
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
          />
        </label>
        <label>
          New password
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={256}
          />
        </label>
        <label>
          Confirm new password
          <input
            name="confirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={256}
          />
        </label>
        <button disabled={busy}>Save new credentials</button>
      </form>
    </section>
  );
}
