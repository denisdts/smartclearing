import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
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
import { AppState, Platform } from 'react-native';

import { ApiError } from '@/api/client';
import {
  registerPushTokenRequest,
  unregisterPushTokenRequest,
} from '@/api/catalog';
import { useAuth } from '@/auth/AuthContext';
import {
  ensurePushPermissions,
  getExpoPushToken,
  isPushSupported,
} from './push';
import {
  loadPushEnabled,
  loadPushToken,
  savePushEnabled,
  savePushToken,
} from './storage';

type PushNotificationsContextValue = {
  enabled: boolean;
  isBusy: boolean;
  isSupported: boolean;
  error: string | null;
  setEnabled: (value: boolean) => Promise<void>;
  unregister: () => Promise<void>;
};

const PushNotificationsContext =
  createContext<PushNotificationsContextValue | null>(null);

function getDeepLink(notification: Notifications.Notification): string | null {
  const url = notification.request.content.data?.url;

  return typeof url === 'string' && url.startsWith('/') ? url : null;
}

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const { session, refreshSession } = useAuth();
  const [enabled, setEnabledState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabledRef = useRef(false);
  const pushTokenRef = useRef<string | null>(null);
  const registeredUserIdRef = useRef<number | null>(null);
  const sessionRef = useRef(session);
  const pendingUrlRef = useRef<string | null>(null);
  const lastSyncAtRef = useRef(0);
  const isSupported = isPushSupported();

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const runWithAuth = useCallback(
    async (request: (token: string) => Promise<void>) => {
      const current = sessionRef.current;
      if (!current) {
        throw new Error('Требуется авторизация.');
      }

      try {
        await request(current.token);
      } catch (requestError) {
        if (
          requestError instanceof ApiError &&
          requestError.status === 401
        ) {
          const nextToken = await refreshSession();
          if (!nextToken) {
            throw requestError;
          }
          await request(nextToken);
          return;
        }

        throw requestError;
      }
    },
    [refreshSession],
  );

  const syncToken = useCallback(async () => {
    const pushToken = await getExpoPushToken();

    await runWithAuth((authToken) =>
      registerPushTokenRequest(pushToken, authToken, Platform.OS),
    );

    pushTokenRef.current = pushToken;
    lastSyncAtRef.current = Date.now();
    await savePushToken(pushToken);
  }, [runWithAuth]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadPushEnabled(), loadPushToken()])
      .then(([storedEnabled, storedToken]) => {
        if (cancelled) {
          return;
        }

        enabledRef.current = storedEnabled;
        setEnabledState(storedEnabled);
        pushTokenRef.current = storedToken;
        setIsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!enabled || !session || !isSupported) {
      registeredUserIdRef.current = null;
      return;
    }

    if (registeredUserIdRef.current === session.user.id) {
      return;
    }

    let cancelled = false;
    registeredUserIdRef.current = session.user.id;

    ensurePushPermissions()
      .then(async (granted) => {
        if (cancelled) {
          return;
        }

        if (!granted) {
          throw new Error('Разрешение на push-уведомления не выдано.');
        }

        await syncToken();

        if (!cancelled) {
          setError(null);
        }
      })
      .catch((syncError) => {
        if (!cancelled) {
          registeredUserIdRef.current = null;
          setError(
            syncError instanceof Error
              ? syncError.message
              : 'Не удалось включить push-уведомления.',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, enabled, session, isSupported, syncToken]);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (
        state !== 'active' ||
        !enabledRef.current ||
        !sessionRef.current ||
        Date.now() - lastSyncAtRef.current < 5 * 60 * 1000
      ) {
        return;
      }

      void syncToken().catch(() => undefined);
    });

    return () => {
      subscription.remove();
    };
  }, [isSupported, syncToken]);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const redirect = (notification: Notifications.Notification) => {
      const url = getDeepLink(notification);

      if (!url) {
        return;
      }

      if (sessionRef.current) {
        router.push(url as unknown as Href);
      } else {
        pendingUrlRef.current = url;
      }
    };

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse?.notification) {
      redirect(lastResponse.notification);
      Notifications.clearLastNotificationResponse();
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        redirect(response.notification);
        Notifications.clearLastNotificationResponse();
      });

    return () => {
      subscription.remove();
    };
  }, [isSupported]);

  useEffect(() => {
    const url = pendingUrlRef.current;

    if (url && session) {
      pendingUrlRef.current = null;
      router.push(url as unknown as Href);
    }
  }, [session]);

  const enable = useCallback(async () => {
    if (!isSupported) {
      setError('Push-уведомления доступны только в мобильном приложении.');
      return;
    }

    if (!sessionRef.current) {
      setError('Сначала войдите в аккаунт.');
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const granted = await ensurePushPermissions();

      if (!granted) {
        throw new Error('Разрешение на push-уведомления не выдано.');
      }

      await syncToken();

      registeredUserIdRef.current = sessionRef.current.user.id;
      enabledRef.current = true;
      setEnabledState(true);
      await savePushEnabled(true);
    } catch (enableError) {
      setError(
        enableError instanceof Error
          ? enableError.message
          : 'Не удалось включить push-уведомления.',
      );
    } finally {
      setIsBusy(false);
    }
  }, [isSupported, syncToken]);

  const disable = useCallback(async () => {
    setIsBusy(true);
    setError(null);

    try {
      const token = pushTokenRef.current ?? (await loadPushToken());

      if (token && sessionRef.current) {
        try {
          await runWithAuth((authToken) =>
            unregisterPushTokenRequest(token, authToken),
          );
        } catch {
          // Removing the token locally is enough to stop notifications
          // after the next registration.
        }
      }

      pushTokenRef.current = null;
      registeredUserIdRef.current = null;
      enabledRef.current = false;
      setEnabledState(false);
      await savePushToken(null);
      await savePushEnabled(false);
    } finally {
      setIsBusy(false);
    }
  }, [runWithAuth]);

  const unregister = useCallback(async () => {
    const token = pushTokenRef.current ?? (await loadPushToken());

    if (token && sessionRef.current) {
      try {
        await runWithAuth((authToken) =>
          unregisterPushTokenRequest(token, authToken),
        );
      } catch {
        // Best effort: the server token will be replaced on the next login.
      }
    }

    pushTokenRef.current = null;
    registeredUserIdRef.current = null;
    await savePushToken(null);
  }, [runWithAuth]);

  const setEnabled = useCallback(
    async (value: boolean) => {
      if (value) {
        await enable();
      } else {
        await disable();
      }
    },
    [disable, enable],
  );

  const value = useMemo(
    () => ({
      enabled,
      isBusy,
      isSupported,
      error,
      setEnabled,
      unregister,
    }),
    [enabled, isBusy, isSupported, error, setEnabled, unregister],
  );

  return (
    <PushNotificationsContext.Provider value={value}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications(): PushNotificationsContextValue {
  const value = useContext(PushNotificationsContext);
  if (!value) {
    throw new Error(
      'usePushNotifications must be used within <PushNotificationsProvider />',
    );
  }
  return value;
}
