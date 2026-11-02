import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { loadSession, saveSession } from './storage';

export type Session = {
  email: string;
  token: string;
};

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    loadSession()
      .then((raw) => {
        if (cancelled || !raw) {
          return;
        }
        try {
          const parsed = JSON.parse(raw) as Session;
          if (parsed?.email && parsed?.token) {
            setSession(parsed);
          }
        } catch {
          setSession(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, _password: string) => {
    const next: Session = {
      email: email.trim(),
      token: `mock-${Date.now()}`,
    };
    await saveSession(JSON.stringify(next));
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    await saveSession(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, isLoading, signIn, signOut }),
    [session, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within <AuthProvider />');
  }
  return value;
}
