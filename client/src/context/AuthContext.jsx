import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createHttp } from '../api/http';
import { profile } from '../api/users';

const AuthContext = createContext(null);
const storageKey = 'secure-notes.jwt';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem(storageKey);
    return token ? { token, user: null } : null;
  });

  const signOut = useCallback((expiredToken) => {
    if (expiredToken && localStorage.getItem(storageKey) !== expiredToken)
      return;
    localStorage.removeItem(storageKey);
    setSession(null);
  }, []);

  function startSession(next) {
    localStorage.setItem(storageKey, next.token);
    setSession(next);
  }

  const token = session?.token;
  const user = session?.user;
  const http = useMemo(() => createHttp(token, signOut), [token, signOut]);

  useEffect(() => {
    if (!token || user) return;
    const controller = new AbortController();
    profile(http, controller.signal)
      .then((account) => {
        if (!controller.signal.aborted) {
          setSession((current) =>
            current?.token === token ? { token, user: account } : current,
          );
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) signOut(token);
      });
    return () => controller.abort();
  }, [http, signOut, token, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        http,
        loading: Boolean(token && !user),
        startSession,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
