import { useState } from 'react';

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(operation) {
    setBusy(true);
    setError('');
    try {
      await operation();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, run, clearError: () => setError('') };
}
