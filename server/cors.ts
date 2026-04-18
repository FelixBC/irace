import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createLogger } from './logger.js';

const log = createLogger('cors');

function allowedOriginsList(): string[] {
  const raw = process.env.ALLOWED_ORIGINS?.trim();
  const fromEnv = raw
    ? raw.split(',').map((s) => s.trim()).filter(Boolean)
    : process.env.FRONTEND_URL?.trim()
      ? [process.env.FRONTEND_URL.trim()]
      : [];

  if (process.env.NODE_ENV === 'production') {
    return fromEnv;
  }

  const devDefaults = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  return [...new Set([...fromEnv, ...devDefaults])];
}

/**
 * Sets `Access-Control-Allow-Origin` from an allowlist (`ALLOWED_ORIGINS` or `FRONTEND_URL`).
 * Falls back to `*` when nothing is configured (local dev); logs a warning in production.
 */
export function applyCors(req: VercelRequest, res: VercelResponse): void {
  const allowed = allowedOriginsList();
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;

  if (allowed.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      log.warn('No ALLOWED_ORIGINS or FRONTEND_URL — using wildcard CORS');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    return;
  }

  res.setHeader('Vary', 'Origin');

  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    return;
  }

  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', allowed[0]);
    return;
  }

  /* Browser sent a disallowed Origin — omit ACAO so the client cannot read the response. */
}
