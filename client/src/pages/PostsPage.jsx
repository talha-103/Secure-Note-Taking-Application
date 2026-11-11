import { useCallback, useState } from 'react';
import { listPosts, publishPost } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import ContentForm, { emptyContent } from '../components/ContentForm';
import PagedList from '../components/PagedList';
import { useAction } from '../components/useAction';
import { usePage } from '../components/usePage';

export default function PostsPage() {
  const { http } = useAuth();
  const [authorInput, setAuthorInput] = useState('');
  const [author, setAuthor] = useState('');
  const [post, setPost] = useState(emptyContent);
  const load = useCallback(
    (client, page, signal) => listPosts(client, author, page, signal),
    [author],
  );
  const listing = usePage(load);
  const { busy, error, run } = useAction();

  function selectAuthor(email) {
    setAuthor(email);
    listing.setPage(1);
    listing.refresh();
  }

  return (
    <section>
      <h2>Posts</h2>
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          selectAuthor(authorInput.trim());
        }}
      >
        <label>
          Author email{' '}
          <input
            type="email"
            value={authorInput}
            onChange={(event) => setAuthorInput(event.target.value)}
          />
        </label>
        <button>Find posts</button>
        <button
          type="button"
          onClick={() => {
            setAuthorInput('');
            selectAuthor('');
          }}
        >
          Show all posts
        </button>
      </form>
      <ContentForm
        value={post}
        onChange={setPost}
        busy={busy}
        label="Publish post"
        onSubmit={() =>
          run(async () => {
            await publishPost(http, post);
            setPost(emptyContent);
            setAuthorInput('');
            selectAuthor('');
          })
        }
      />
      <PagedList
        listing={listing}
        columns={['Title', 'Content', 'Name', 'Email']}
        renderItem={(item) => (
          <tr key={item._id}>
            <td>{item.title}</td>
            <td>{item.content}</td>
            <td>
              {(item.authorProfile ?? listing.result.author)?.name || '—'}
            </td>
            <td>
              {(item.authorProfile ?? listing.result.author)?.email || '—'}
            </td>
          </tr>
        )}
      />
    </section>
  );
}
