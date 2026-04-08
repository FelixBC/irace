export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getSessionToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('session_token');
}

export function getAuthHeader(): { Authorization: string } | Record<string, never> {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export async function readJsonOrNull<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function assertOk(res: Response, fallbackMessage: string): Promise<void> {
  if (res.ok) return;
  const body = await readJsonOrNull<unknown>(res);
  const maybeError =
    body && typeof body === 'object' && 'error' in body ? (body as { error?: unknown }).error : undefined;
  const message = typeof maybeError === 'string' && maybeError.trim() ? maybeError : fallbackMessage;
  throw new ApiError(message, res.status, body);
}

