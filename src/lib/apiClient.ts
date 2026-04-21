import { z, ZodError } from 'zod';

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

/** Thrown when response JSON does not match the expected Zod schema. */
export class ValidationError extends Error {
  readonly zodError: ZodError;

  constructor(zodError: ZodError) {
    super(`API response validation failed: ${zodError.message}`);
    this.name = 'ValidationError';
    this.zodError = zodError;
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

/**
 * Parse JSON body with a Zod schema (runtime contract). Prefer this for API boundaries.
 */
export async function parseJsonResponse<O>(res: Response, schema: z.ZodType<O, z.ZodTypeDef, unknown>): Promise<O> {
  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new ApiError('Response is not valid JSON', res.status);
  }
  try {
    return schema.parse(raw);
  } catch (e) {
    if (e instanceof ZodError) {
      throw new ValidationError(e);
    }
    throw e;
  }
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

/** JSON body + Bearer session token when present (typical authenticated API calls). */
export function jsonAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
  };
}

/** JSON + explicit Bearer token (e.g. push helpers where the caller passes the session token). */
export function jsonBearerHeaders(bearerToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${bearerToken}`,
  };
}

