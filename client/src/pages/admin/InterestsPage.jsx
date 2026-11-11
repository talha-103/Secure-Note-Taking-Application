import { listInterests } from '../../api/users';
import PagedList from '../../components/PagedList';
import { usePage } from '../../components/usePage';

export default function InterestsPage() {
  const listing = usePage(listInterests);
  return (
    <section>
      <h2>Interest groups</h2>
      <PagedList
        listing={listing}
        columns={['Interest', 'Name', 'Email']}
        renderItem={(group) =>
          group.users.map((user) => (
            <tr key={group._id + ':' + user._id}>
              <td>{group._id}</td>
              <td>{user.name || '—'}</td>
              <td>{user.email}</td>
            </tr>
          ))
        }
      />
    </section>
  );
}
