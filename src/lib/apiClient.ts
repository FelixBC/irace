import { z, ZodError } from 'zod';
import { API_BASE_URL } from '../config/api';
import {
  clearAuthTokens,
  getAccessExpiresAtMs,
  getAccessToken as readAccessToken,
  getRefreshToken as readRefreshToken,
  setAccessTokenOnly,
} from './sessionStore';

export { getAccessToken, getRefreshToken } from './sessionStore';

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

let refreshInFlight: Promise<void> | null = null;

/**
 * Refresh the access JWT using the in-memory refresh token when near expiry.
 */
export async function refreshAccessIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (Date.now() < getAccessExpiresAtMs() - 30_000) return;

  const r = readRefreshToken();
  if (!r) return;

  if (refreshInFlight) {
    await refreshInFlight;
    return;
  }

  refreshInFlight = (async () => {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: r }),
    });
    if (!res.ok) {
      clearAuthTokens();
      throw new Error('Session refresh failed');
    }
    const data = (await res.json()) as { accessToken: string; expiresIn: number };
    setAccessTokenOnly(data.accessToken, data.expiresIn);
  })().finally(() => {
    refreshInFlight = null;
  });

  await refreshInFlight;
}

/**
 * fetch() with Authorization from in-memory access token; refreshes access when needed.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    await refreshAccessIfNeeded();
  } catch {
    /* still attempt request; caller may get 401 */
  }
  const headers = new Headers(init?.headers);
  const t = readAccessToken();
  if (t) headers.set('Authorization', `Bearer ${t}`);
  return fetch(input, { ...init, headers });
}

/** Current access JWT for Web Push helpers (same value as Bearer for API calls). */
export function getSessionToken(): string | null {
  return readAccessToken();
}

export function getAuthHeader(): { Authorization: string } | Record<string, never> {
  const token = readAccessToken();
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

/** JSON body + Bearer access token when present (typical authenticated API calls). */
export function jsonAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
  };
}

/** JSON + explicit Bearer token (e.g. push helpers where the caller passes the access JWT). */
export function jsonBearerHeaders(bearerToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${bearerToken}`,
  };
}
