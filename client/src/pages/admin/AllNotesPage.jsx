import { listAllNotes } from '../../api/notes';
import PagedList from '../../components/PagedList';
import { usePage } from '../../components/usePage';

export default function AllNotesPage() {
  const listing = usePage(listAllNotes);
  return (
    <section>
      <h2>All notes</h2>
      <PagedList
        listing={listing}
        renderItem={(note) => (
          <article key={note._id}>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            <p>
              Owner <code>{note.owner}</code>
            </p>
          </article>
        )}
      />
    </section>
  );
}
