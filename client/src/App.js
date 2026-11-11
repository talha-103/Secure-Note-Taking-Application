import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RegisterPage from './pages/RegisterPage';
import './ui.css';
import SignInPage from './pages/SignInPage';
import NotesPage from './pages/NotesPage';
import PostsPage from './pages/PostsPage';
import AllNotesPage from './pages/admin/AllNotesPage';
import InterestsPage from './pages/admin/InterestsPage';
import UsersPage from './pages/admin/UsersPage';

function Layout() {
  const { user, signOut } = useAuth();
  return (
    <main>
      <h1>Secure Notes</h1>
      {user && (
        <>
          <nav aria-label="Main navigation">
            <Link to="/notes">My notes</Link> <Link to="/posts">Posts</Link>{' '}
            {user.role === 'admin' && (
              <>
                <Link to="/admin/notes">All notes</Link>{' '}
                <Link to="/admin/users">Users</Link>{' '}
                <Link to="/admin/interests">Interest groups</Link>{' '}
              </>
            )}
            <button onClick={() => signOut()}>Sign out</button>
          </nav>
          <p>
            Signed in as {user.name ? user.name + ' · ' : ''}
            {user.email}
          </p>
        </>
      )}
      <Outlet />
    </main>
  );
}

function RequireUser({ admin = false }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Checking session…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/notes" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<SignInPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route element={<RequireUser />}>
            <Route path="notes" element={<NotesPage />} />
            <Route path="posts" element={<PostsPage />} />
          </Route>
          <Route element={<RequireUser admin />}>
            <Route path="admin/notes" element={<AllNotesPage />} />
            <Route path="admin/users" element={<UsersPage />} />
            <Route path="admin/interests" element={<InterestsPage />} />
          </Route>
          <Route
            path="*"
            element={
              <section>
                <h2>Page not found</h2>
                <Link to="/">Go home</Link>
              </section>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
