import type { VercelRequest } from '@vercel/node';

/** First string value for a query key (Vercel may supply `string | string[]`). */
export function getQueryString(req: VercelRequest, key: string): string | undefined {
  const queryValue = req.query[key];
  if (typeof queryValue === 'string') return queryValue;
  if (Array.isArray(queryValue) && typeof queryValue[0] === 'string') return queryValue[0];
  return undefined;
}

/**
 * `userId` from dynamic route `/api/users/:userId/stats` — prefer `req.query`, fall back to pathname
 * when the runtime does not merge path params into query.
 */
export function getUsersStatsUserId(req: VercelRequest): string | undefined {
  const fromQuery = getQueryString(req, 'userId');
  if (fromQuery) return fromQuery;
  const raw = req.url;
  if (!raw) return undefined;
  const pathOnly = raw.split('?')[0];
  const segments = pathOnly.split('/').filter(Boolean);
  const uIdx = segments.indexOf('users');
  if (uIdx >= 0 && segments[uIdx + 1] && segments[uIdx + 2] === 'stats') {
    return segments[uIdx + 1];
  }
  return undefined;
}
