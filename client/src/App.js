import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
            Signed in as {user.email} ({user.role}). User ID{' '}
            <code>{user._id}</code>
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
  if (!user) return <Navigate to="/" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/notes" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<SignInPage />} />
          <Route element={<RequireUser />}>
            <Route path="notes" element={<NotesPage />} />
            <Route path="posts" element={<PostsPage />} />
          </Route>
          <Route element={<RequireUser admin />}>
            <Route path="admin/notes" element={<AllNotesPage />} />
            <Route path="admin/users" element={<UsersPage />} />
            <Route path="admin/interests" element={<InterestsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
