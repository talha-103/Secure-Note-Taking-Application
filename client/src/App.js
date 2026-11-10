import { useEffect, useState } from 'react';
import './App.css';

const emptyNote = { title: '', content: '' };
const emptyUser = { email: '', password: '', interests: '', role: 'user' };

async function request(path, token, method = 'GET', body) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch('/api' + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (response.status === 204) return;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function Pager({ page, hasMore, setPage }) {
  return <nav aria-label="Pagination">
    <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
    <span>Page {page}</span>
    <button disabled={!hasMore} onClick={() => setPage(page + 1)}>Next</button>
  </nav>;
}

function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('notes');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [register, setRegister] = useState(false);
  const [credentials, setCredentials] = useState(emptyUser);
  const [note, setNote] = useState(emptyNote);
  const [user, setUser] = useState(emptyUser);
  const [authorInput, setAuthorInput] = useState('');
  const [author, setAuthor] = useState('');
  const [post, setPost] = useState(emptyNote);

  const token = session?.token;
  const routes = { notes: '/notes', all: '/admin/notes', users: '/admin/users', interests: '/admin/interests' };
  const path = view === 'posts'
    ? author && '/users/' + encodeURIComponent(author) + '/posts'
    : token && routes[view];

  useEffect(() => {
    setData(null);
    if (!path) return;
    let current = true;
    request(path + '?page=' + page, token).then(result => {
      if (current) setData(result);
    }).catch(err => {
      if (current) setError(err.message);
    });
    return () => { current = false; };
  }, [path, token, page, revision]);

  function changeView(next) {
    setView(next);
    setPage(1);
    setError('');
    setData(null);
    setNote(emptyNote);
    setUser(emptyUser);
  }

  async function act(operation) {
    setBusy(true);
    setError('');
    try {
      await operation();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function submit(event, operation) {
    event.preventDefault();
    act(operation);
  }

  function refresh() {
    setRevision(value => value + 1);
  }

  function userPayload(form) {
    return { email: form.email, password: form.password, role: form.role,
      interests: form.interests.split(',').map(value => value.trim()).filter(Boolean) };
  }

  return <main>
    <h1>Secure Notes</h1>
    <nav aria-label="Main navigation">
      {session && <button onClick={() => changeView('notes')}>My notes</button>}
      {session?.user.role === 'admin' && <>
        <button onClick={() => changeView('all')}>All notes</button>
        <button onClick={() => changeView('users')}>Users</button>
        <button onClick={() => changeView('interests')}>Interest groups</button>
      </>}
      <button onClick={() => changeView('posts')}>Public posts</button>
      {session && <button onClick={() => {
        setSession(null);
        setAuthor('');
        setAuthorInput('');
        setPost(emptyNote);
        changeView('notes');
      }}>Sign out</button>}
    </nav>
    {session && <p>Signed in as {session.user.email} ({session.user.role}). User ID <code>{session.user._id}</code></p>}
    {error && <p role="alert">{error}</p>}

    {!session && view !== 'posts' && <section>
      <h2>{register ? 'Create an account' : 'Sign in'}</h2>
      <form onSubmit={event => submit(event, async () => {
        const nextSession = await request(register ? '/auth/register' : '/auth/login', null, 'POST', userPayload(credentials));
        setSession(nextSession);
        setCredentials(emptyUser);
        changeView('notes');
      })}>
        <label>Email<input type="email" required value={credentials.email} onChange={event => setCredentials({ ...credentials, email: event.target.value })} /></label>
        <label>Password<input type="password" required minLength={register ? 8 : 1} value={credentials.password} onChange={event => setCredentials({ ...credentials, password: event.target.value })} /></label>
        {register && <label>Interests (comma separated)<input value={credentials.interests} onChange={event => setCredentials({ ...credentials, interests: event.target.value })} /></label>}
        <button disabled={busy}>{register ? 'Register' : 'Sign in'}</button>
      </form>
      <button onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Use an existing account' : 'Register instead'}</button>
    </section>}

    {session && view === 'notes' && <section>
      <h2>My notes</h2>
      <form onSubmit={event => submit(event, async () => {
        await request('/notes' + (note._id ? '/' + note._id : ''), token, note._id ? 'PUT' : 'POST', note);
        if (!note._id) setPage(1);
        setNote(emptyNote);
        refresh();
      })}>
        <label>Title<input required maxLength={200} value={note.title} onChange={event => setNote({ ...note, title: event.target.value })} /></label>
        <label>Content<textarea maxLength={20000} value={note.content} onChange={event => setNote({ ...note, content: event.target.value })} /></label>
        <button disabled={busy}>{note._id ? 'Save note' : 'Create note'}</button>
        {note._id && <button type="button" onClick={() => setNote(emptyNote)}>Cancel edit</button>}
      </form>
    </section>}

    {session && view === 'all' && <h2>All notes</h2>}
    {session && view === 'interests' && <h2>Interest groups</h2>}
    {session && view === 'users' && <section>
      <h2>Manage users</h2>
      <form onSubmit={event => submit(event, async () => {
        const payload = userPayload(user);
        if (user._id && !payload.password) delete payload.password;
        await request('/admin/users' + (user._id ? '/' + user._id : ''), token, user._id ? 'PATCH' : 'POST', payload);
        if (!user._id) setPage(1);
        setUser(emptyUser);
        refresh();
      })}>
        <label>Email<input type="email" required value={user.email} onChange={event => setUser({ ...user, email: event.target.value })} /></label>
        <label>{user._id ? 'New password (optional)' : 'Password'}<input type="password" minLength={8} required={!user._id} value={user.password} onChange={event => setUser({ ...user, password: event.target.value })} /></label>
        <label>Interests (comma separated)<input value={user.interests} onChange={event => setUser({ ...user, interests: event.target.value })} /></label>
        <label>Role<select value={user.role} onChange={event => setUser({ ...user, role: event.target.value })}>
          <option value="user">User</option><option value="admin">Admin</option>
        </select></label>
        <button disabled={busy}>{user._id ? 'Save user' : 'Add user'}</button>
        {user._id && <button type="button" onClick={() => setUser(emptyUser)}>Cancel edit</button>}
      </form>
    </section>}

    {view === 'posts' && <section>
      <h2>Public posts</h2>
      {!session && <button onClick={() => changeView('notes')}>Back to sign in</button>}
      <form onSubmit={event => {
        event.preventDefault();
        setError('');
        setPage(1);
        setAuthor(authorInput.trim());
        refresh();
      }}>
        <label>Author user ID<input required value={authorInput} onChange={event => setAuthorInput(event.target.value)} /></label>
        <button>Find posts</button>
      </form>
      {session && <form onSubmit={event => submit(event, async () => {
        await request('/posts', token, 'POST', post);
        setPost(emptyNote);
        setAuthorInput(session.user._id);
        setAuthor(session.user._id);
        setPage(1);
        refresh();
      })}>
        <label>Post title<input required maxLength={200} value={post.title} onChange={event => setPost({ ...post, title: event.target.value })} /></label>
        <label>Post content<textarea maxLength={20000} value={post.content} onChange={event => setPost({ ...post, content: event.target.value })} /></label>
        <button disabled={busy}>Publish post</button>
      </form>}
    </section>}

    {data && <>
      {data.items.length === 0 && <p>No results on this page.</p>}
      {data.items.map(item => <article key={item._id}>
        <h3>{item.title || item.email || item._id}</h3>
        {item.content && <p className="content">{item.content}</p>}
        {view === 'all' && <p>Owner <code>{item.owner}</code></p>}
        {view === 'interests' && <ul>{item.users.map(member => <li key={member._id}>{member.email}</li>)}</ul>}
        {view === 'users' && <p>{item.role} · {item.interests.join(', ') || 'No interests'} · <code>{item._id}</code></p>}
        {view === 'notes' && <button onClick={() => setNote(item)}>Edit</button>}
        {view === 'users' && <button onClick={() => setUser({ ...item, password: '', interests: item.interests.join(', ') })}>Edit</button>}
        {(view === 'notes' || (view === 'users' && item._id !== session?.user._id)) &&
          <button disabled={busy} onClick={() => act(async () => {
            await request((view === 'notes' ? '/notes/' : '/admin/users/') + item._id, token, 'DELETE');
            if (view === 'notes' && note._id === item._id) setNote(emptyNote);
            if (view === 'users' && user._id === item._id) setUser(emptyUser);
            if (data.items.length === 1 && page > 1) setPage(page - 1);
            refresh();
          })}>Delete</button>}
      </article>)}
      <Pager page={page} hasMore={data.hasMore} setPage={next => { setError(''); setPage(next); }} />
    </>}
  </main>;
}

export default App;
