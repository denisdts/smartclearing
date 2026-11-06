import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { loginRequest } from '@/api/catalog';
import { loadSession, saveSession } from './storage';

export type SessionUser = {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
};

export type Session = {
  token: string;
  expiresAt: string;
  user: SessionUser;
};

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  signIn: (login: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isSessionValid(session: Session): boolean {
  if (!session.token || !session.user || !session.expiresAt) {
    return false;
  }

  const expiresAt = Date.parse(session.expiresAt);

  return Number.isNaN(expiresAt) || expiresAt > Date.now();
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    loadSession()
      .then(async (raw) => {
        if (cancelled || !raw) {
          return;
        }

        try {
          const parsed = JSON.parse(raw) as Session;
          if (isSessionValid(parsed)) {
            setSession(parsed);
          } else {
            await saveSession(null);
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

  const signIn = useCallback(async (login: string, password: string) => {
    const response = await loginRequest(login.trim(), password);

    const next: Session = {
      token: response.access_token,
      expiresAt: response.expires_at,
      user: {
        id: response.user.id,
        login: response.user.login,
        email: response.user.email,
        name: response.user.name,
      },
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
