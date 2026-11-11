import Pagination from './Pagination';

export default function PagedList({ listing, columns, renderItem }) {
  const { result, error, setPage } = listing;
  if (error) return <p role="alert">{error}</p>;
  if (!result) return null;
  return (
    <>
      {result.data.length === 0 && <p>No results on this page.</p>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{result.data.map(renderItem)}</tbody>
        </table>
      </div>
      <Pagination result={result} setPage={setPage} />
    </>
  );
}
