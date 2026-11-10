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
        renderItem={(group) => (
          <article key={group._id}>
            <h3>{group._id}</h3>
            <ul>
              {group.users.map((user) => (
                <li key={user._id}>{user.email}</li>
              ))}
            </ul>
          </article>
        )}
      />
    </section>
  );
}
