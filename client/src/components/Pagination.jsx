export default function Pagination({ result, setPage }) {
  const { page, limit, total } = result;
  return (
    <nav aria-label="Pagination">
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>
        Previous
      </button>
      <span> Page {page} </span>
      <button
        disabled={page * limit >= total}
        onClick={() => setPage(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
