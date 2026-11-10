import { useCallback, useState } from 'react';
import { listPosts, publishPost } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import ContentForm, { emptyContent } from '../components/ContentForm';
import PagedList from '../components/PagedList';
import { useAction } from '../components/useAction';
import { usePage } from '../components/usePage';

export default function PostsPage() {
  const { http, user } = useAuth();
  const [authorInput, setAuthorInput] = useState(user._id);
  const [author, setAuthor] = useState(user._id);
  const [post, setPost] = useState(emptyContent);
  const load = useCallback(
    (client, page, signal) => listPosts(client, author, page, signal),
    [author],
  );
  const listing = usePage(load);
  const { busy, error, run } = useAction();

  function selectAuthor(id) {
    setAuthor(id);
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
          Author user ID{' '}
          <input
            required
            pattern="[a-fA-F0-9]{24}"
            value={authorInput}
            onChange={(event) => setAuthorInput(event.target.value)}
          />
        </label>
        <button>Find posts</button>
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
            setAuthorInput(user._id);
            selectAuthor(user._id);
          })
        }
      />
      <PagedList
        listing={listing}
        renderItem={(item) => (
          <article key={item._id}>
            <h3>{item.title}</h3>
            <p>{item.content}</p>
          </article>
        )}
      />
    </section>
  );
}
