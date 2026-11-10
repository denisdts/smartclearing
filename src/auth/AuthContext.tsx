import { AppState } from 'react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { ApiError } from '@/api/client';
import { loginRequest, refreshRequest } from '@/api/catalog';
import {
  loadRememberAuth,
  loadSession,
  saveRememberAuth,
  saveSession,
} from './storage';

export type SessionUser = {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
};

export type Session = {
  token: string;
  expiresAt: string;
  refreshToken: string | null;
  refreshExpiresAt: string | null;
  user: SessionUser;
};

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  rememberAuth: boolean;
  signIn: (login: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setRememberAuth: (value: boolean) => Promise<void>;
  refreshSession: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isSessionValid(session: Session): boolean {
  if (!session.token || !session.user || !session.expiresAt) {
    return false;
  }

  const expiresAt = Date.parse(session.expiresAt);

  return Number.isNaN(expiresAt) || expiresAt > Date.now();
}

function isRefreshValid(session: Session): boolean {
  if (!session.refreshToken || !session.refreshExpiresAt) {
    return false;
  }

  const expiresAt = Date.parse(session.refreshExpiresAt);

  return Number.isNaN(expiresAt) || expiresAt > Date.now();
}

function parseSession(raw: string): Session | null {
  try {
    const value = JSON.parse(raw) as Partial<Session> | null;

    if (!value || typeof value !== 'object' || !value.token || !value.expiresAt) {
      return null;
    }

    if (!value.user || typeof value.user !== 'object') {
      return null;
    }

    return {
      token: value.token,
      expiresAt: value.expiresAt,
      refreshToken:
        typeof value.refreshToken === 'string' ? value.refreshToken : null,
      refreshExpiresAt:
        typeof value.refreshExpiresAt === 'string'
          ? value.refreshExpiresAt
          : null,
      user: value.user as SessionUser,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberAuth, setRememberAuthState] = useState(true);
  const sessionRef = useRef<Session | null>(null);
  const rememberAuthRef = useRef(true);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const current = sessionRef.current;
    const refreshToken = current?.refreshToken;

    if (!current || !refreshToken) {
      return null;
    }

    if (!isRefreshValid(current)) {
      sessionRef.current = null;
      setSession(null);
      await saveSession(null);
      return null;
    }

    const request = (async () => {
      try {
        const response = await refreshRequest(refreshToken);

        const next: Session = {
          token: response.access_token,
          expiresAt: response.expires_at,
          refreshToken: response.refresh_token ?? current.refreshToken,
          refreshExpiresAt:
            response.refresh_expires_at ?? current.refreshExpiresAt,
          user: response.user
            ? {
                id: response.user.id,
                login: response.user.login,
                email: response.user.email,
                name: response.user.name,
              }
            : current.user,
        };

        sessionRef.current = next;
        setSession(next);

        if (rememberAuthRef.current) {
          await saveSession(JSON.stringify(next));
        }

        return next.token;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          sessionRef.current = null;
          setSession(null);
          await saveSession(null);
          return null;
        }

        throw error;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = request;

    return request;
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadSession(), loadRememberAuth()])
      .then(async ([raw, remember]) => {
        if (cancelled) {
          return;
        }

        rememberAuthRef.current = remember;
        setRememberAuthState(remember);

        if (!remember || !raw) {
          if (!remember && raw) {
            await saveSession(null);
          }
          return;
        }

        const stored = parseSession(raw);
        if (!stored) {
          await saveSession(null);
          return;
        }

        const accessExpiresAt = Date.parse(stored.expiresAt);
        const accessExpiresSoon =
          !Number.isNaN(accessExpiresAt) &&
          accessExpiresAt - Date.now() <= 60_000;

        if (
          isSessionValid(stored) &&
          (!accessExpiresSoon || !isRefreshValid(stored))
        ) {
          sessionRef.current = stored;
          setSession(stored);
          return;
        }

        if (!isRefreshValid(stored)) {
          await saveSession(null);
          return;
        }

        sessionRef.current = stored;
        setSession(stored);

        try {
          const token = await refreshSession();
          if (!token && !cancelled) {
            sessionRef.current = null;
            setSession(null);
            await saveSession(null);
          }
        } catch {
          // Network unavailable: keep the stored session so a retry can refresh it.
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        return;
      }

      const current = sessionRef.current;
      if (!current?.refreshToken) {
        return;
      }

      const expiresAt = Date.parse(current.expiresAt);
      if (Number.isNaN(expiresAt) || expiresAt - Date.now() <= 60_000) {
        void refreshSession().catch(() => undefined);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshSession]);

  const signIn = useCallback(async (login: string, password: string) => {
    const response = await loginRequest(login.trim(), password);

    const next: Session = {
      token: response.access_token,
      expiresAt: response.expires_at,
      refreshToken: response.refresh_token ?? null,
      refreshExpiresAt: response.refresh_expires_at ?? null,
      user: {
        id: response.user.id,
        login: response.user.login,
        email: response.user.email,
        name: response.user.name,
      },
    };

    sessionRef.current = next;
    setSession(next);

    if (rememberAuthRef.current) {
      await saveSession(JSON.stringify(next));
    } else {
      await saveSession(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    sessionRef.current = null;
    setSession(null);
    await saveSession(null);
  }, []);

  const setRememberAuth = useCallback(async (value: boolean) => {
    rememberAuthRef.current = value;
    setRememberAuthState(value);
    await saveRememberAuth(value);

    const current = sessionRef.current;
    if (value && current) {
      await saveSession(JSON.stringify(current));
    } else {
      await saveSession(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      rememberAuth,
      signIn,
      signOut,
      setRememberAuth,
      refreshSession,
    }),
    [
      session,
      isLoading,
      rememberAuth,
      signIn,
      signOut,
      setRememberAuth,
      refreshSession,
    ],
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
