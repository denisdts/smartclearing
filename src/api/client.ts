export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? 'https://smartclearing.ru/api'
).replace(/\/+$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
  formData?: FormData;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let body: BodyInit | undefined;

  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
    });
  } catch {
    throw new ApiError(
      0,
      'network_error',
      'Не удалось подключиться к серверу. Проверьте интернет-соединение.',
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string; details?: unknown } })
      ?.error;

    throw new ApiError(
      response.status,
      error?.code ?? 'request_failed',
      error?.message ?? `Сервер ответил ошибкой ${response.status}`,
      error?.details,
    );
  }

  return payload as T;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Сессия истекла. Войдите снова.';
    }
    if (error.status === 403) {
      return 'Недостаточно прав для этого действия.';
    }
    if (error.status === 404) {
      return 'Данные не найдены. Обновите список и попробуйте снова.';
    }
    if (error.status === 422) {
      return 'Проверьте введённые данные.';
    }
    return error.message;
  }

  return 'Не удалось выполнить запрос. Попробуйте ещё раз.';
}
