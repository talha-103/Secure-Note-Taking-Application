import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function usePage(load) {
  const { http } = useAuth();
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setResult(null);
    setError('');
    if (!load) return;
    const controller = new AbortController();
    load(http, page, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult(data);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [http, load, page, revision]);

  return {
    page,
    setPage,
    result,
    error,
    refresh: () => setRevision((value) => value + 1),
  };
}
