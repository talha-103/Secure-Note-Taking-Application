import Pagination from './Pagination';

export default function PagedList({ listing, renderItem }) {
  const { result, error, setPage } = listing;
  if (error) return <p role="alert">{error}</p>;
  if (!result) return null;
  return (
    <>
      {result.data.length === 0 && <p>No results on this page.</p>}
      {result.data.map(renderItem)}
      <Pagination result={result} setPage={setPage} />
    </>
  );
}
