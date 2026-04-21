import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** Access JWT lifetime (seconds). */
export const ACCESS_TOKEN_TTL_SEC = 15 * 60;

/** Refresh token lifetime from issuance / exchange. */
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** OAuth handoff code TTL (client must exchange quickly). */
export const EXCHANGE_CODE_TTL_MS = 10 * 60 * 1000;

export function requireAuthSessionSecret(): string {
  const s = process.env.AUTH_SESSION_SECRET?.trim();
  if (!s || s.length < 16) {
    throw new Error('AUTH_SESSION_SECRET must be set to a random string of at least 16 characters');
  }
  return s;
}

export function hashOpaqueToken(plain: string): string {
  return createHmac('sha256', requireAuthSessionSecret()).update(plain, 'utf8').digest('hex');
}

function base64urlFromBuffer(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlFromString(s: string): string {
  return base64urlFromBuffer(Buffer.from(s, 'utf8'));
}

export function randomTokenUrlSafe(bytes = 32): string {
  return base64urlFromBuffer(randomBytes(bytes));
}

export function signAccessToken(params: { userId: string; sessionId: string }): string {
  const secret = requireAuthSessionSecret();
  const header = base64urlFromString(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: params.userId,
    sid: params.sessionId,
    typ: 'access',
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SEC,
  };
  const body = base64urlFromString(JSON.stringify(payload));
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest();
  return `${header}.${body}.${base64urlFromBuffer(sig)}`;
}

export type AccessClaims = { userId: string; sessionId: string };

export function verifyAccessToken(token: string): AccessClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, b, sig] = parts;
    const secret = requireAuthSessionSecret();
    const expected = createHmac('sha256', secret).update(`${h}.${b}`).digest();
    let sigBuf: Buffer;
    try {
      sigBuf = Buffer.from(sig, 'base64url');
    } catch {
      return null;
    }
    if (sigBuf.length !== expected.length || !timingSafeEqual(sigBuf, expected)) return null;

    const payload = JSON.parse(Buffer.from(b, 'base64url').toString('utf8')) as {
      sub?: string;
      sid?: string;
      typ?: string;
      exp?: number;
    };
    if (payload.typ !== 'access' || typeof payload.sub !== 'string' || typeof payload.sid !== 'string') return null;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
    return { userId: payload.sub, sessionId: payload.sid };
  } catch {
    return null;
  }
}
