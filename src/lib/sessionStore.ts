/**
 * Client session: access JWT + opaque refresh token kept in memory for requests,
 * mirrored to sessionStorage so reload / OAuth return preserves login until the tab closes.
 */

const STORAGE_KEY = 'irace-auth-session';

let accessToken: string | null = null;
let refreshToken: string | null = null;
/** Epoch ms when access JWT is treated as expired (client-side skew). */
let accessExpiresAtMs = 0;

type PersistedAuth = {
  refreshToken: string;
  accessToken: string;
  accessExpiresAtMs: number;
};

function persist(): void {
  if (typeof window === 'undefined') return;
  try {
    if (refreshToken && accessToken) {
      const payload: PersistedAuth = {
        refreshToken,
        accessToken,
        accessExpiresAtMs,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* quota / private mode */
  }
}

function hydrateFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as Partial<PersistedAuth>;
    if (
      typeof data.refreshToken === 'string' &&
      typeof data.accessToken === 'string' &&
      typeof data.accessExpiresAtMs === 'number'
    ) {
      refreshToken = data.refreshToken;
      accessToken = data.accessToken;
      accessExpiresAtMs = data.accessExpiresAtMs;
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

hydrateFromStorage();

export function setAuthTokens(access: string, refresh: string, expiresInSec: number): void {
  accessToken = access;
  refreshToken = refresh;
  accessExpiresAtMs = Date.now() + expiresInSec * 1000;
  persist();
}

export function setAccessTokenOnly(access: string, expiresInSec: number): void {
  accessToken = access;
  accessExpiresAtMs = Date.now() + expiresInSec * 1000;
  persist();
}

export function clearAuthTokens(): void {
  accessToken = null;
  refreshToken = null;
  accessExpiresAtMs = 0;
  persist();
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function getAccessExpiresAtMs(): number {
  return accessExpiresAtMs;
}

export function hasAuthTokens(): boolean {
  return Boolean(accessToken && refreshToken);
}
