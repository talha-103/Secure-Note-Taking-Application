import { useState } from 'react';
import { listNotes, saveNote, deleteNote } from '../api/notes';
import { useAuth } from '../context/AuthContext';
import ContentForm, { emptyContent } from '../components/ContentForm';
import PagedList from '../components/PagedList';
import { useAction } from '../components/useAction';
import { usePage } from '../components/usePage';

export default function NotesPage() {
  const { http, user } = useAuth();
  const [note, setNote] = useState(emptyContent);
  const listing = usePage(listNotes);
  const { busy, error, run } = useAction();

  return (
    <section>
      <h2>My notes</h2>
      {error && <p role="alert">{error}</p>}
      <ContentForm
        value={note}
        onChange={setNote}
        busy={busy}
        label={note._id ? 'Save note' : 'Create note'}
        onCancel={note._id && (() => setNote(emptyContent))}
        onSubmit={() =>
          run(async () => {
            const { _id, title, content } = note;
            await saveNote(http, _id, { title, content });
            if (!_id) listing.setPage(1);
            setNote(emptyContent);
            listing.refresh();
          })
        }
      />
      <PagedList
        listing={listing}
        columns={['Title', 'Content', 'Name', 'Email', 'Actions']}
        renderItem={(item) => (
          <tr key={item._id}>
            <td>{item.title}</td>
            <td>{item.content}</td>
            <td>{user.name || '—'}</td>
            <td>{user.email}</td>
            <td>
              <button disabled={busy} onClick={() => setNote(item)}>
                Edit
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await deleteNote(http, item._id);
                    if (item._id === note._id) setNote(emptyContent);
                    if (listing.result.data.length === 1 && listing.page > 1)
                      listing.setPage(listing.page - 1);
                    listing.refresh();
                  })
                }
              >
                Delete
              </button>
            </td>
          </tr>
        )}
      />
    </section>
  );
}
