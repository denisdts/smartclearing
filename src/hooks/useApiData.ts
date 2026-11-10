import { useCallback, useEffect, useState } from 'react';

import { ApiError, getErrorMessage } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';

type ApiDataState<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
};

export type ApiDataResult<T> = ApiDataState<T> & {
  reload: () => void;
};

export function useApiData<T>(
  load: (token: string) => Promise<T>,
  token: string | null,
  key: string,
): ApiDataResult<T> {
  const { signOut, refreshSession } = useAuth();
  const [state, setState] = useState<ApiDataState<T>>({
    data: null,
    error: null,
    isLoading: Boolean(token),
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    load(token)
      .then((data) => {
        if (active) {
          setState({ data, error: null, isLoading: false });
        }
      })
      .catch(async (error: unknown) => {
        if (!active) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          try {
            const nextToken = await refreshSession();

            if (!nextToken && active) {
              await signOut();
              return;
            }

            if (active) {
              setState((current) => ({
                data: current.data,
                error: null,
                isLoading: true,
              }));
            }
          } catch {
            if (active) {
              setState((current) => ({
                data: current.data,
                error: 'Не удалось обновить сессию. Проверьте соединение.',
                isLoading: false,
              }));
            }
          }
          return;
        }

        setState((current) => ({
          data: current.data,
          error: getErrorMessage(error),
          isLoading: false,
        }));
      });

    return () => {
      active = false;
    };
  }, [token, key, attempt, signOut, refreshSession, load]);

  const reload = useCallback(() => {
    setState((current) => ({
      data: current.data,
      error: null,
      isLoading: true,
    }));
    setAttempt((value) => value + 1);
  }, []);

  return { ...state, reload };
}
