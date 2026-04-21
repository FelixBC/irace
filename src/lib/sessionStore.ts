/**
 * In-memory app session (access + refresh). Cleared on full page reload by design.
 * Do not use localStorage for these tokens.
 */
let accessToken: string | null = null;
let refreshToken: string | null = null;
/** Epoch ms when access JWT is treated as expired (client-side skew). */
let accessExpiresAtMs = 0;

export function setAuthTokens(access: string, refresh: string, expiresInSec: number): void {
  accessToken = access;
  refreshToken = refresh;
  accessExpiresAtMs = Date.now() + expiresInSec * 1000;
}

export function setAccessTokenOnly(access: string, expiresInSec: number): void {
  accessToken = access;
  accessExpiresAtMs = Date.now() + expiresInSec * 1000;
}

export function clearAuthTokens(): void {
  accessToken = null;
  refreshToken = null;
  accessExpiresAtMs = 0;
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
