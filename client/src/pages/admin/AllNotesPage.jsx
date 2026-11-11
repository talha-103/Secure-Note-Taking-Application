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
        columns={['Title', 'Content', 'Name', 'Email']}
        renderItem={(note) => (
          <tr key={note._id}>
            <td>{note.title}</td>
            <td>{note.content}</td>
            <td>{note.ownerProfile?.name || '—'}</td>
            <td>{note.ownerProfile?.email || '—'}</td>
          </tr>
        )}
      />
    </section>
  );
}
