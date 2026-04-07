import type { VercelRequest } from '@vercel/node';

/** First string value for a query key (Vercel may supply `string | string[]`). */
export function getQueryString(req: VercelRequest, key: string): string | undefined {
  const v = req.query[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return undefined;
}
