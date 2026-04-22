import type { VercelRequest } from '@vercel/node';

/** First string value for a query key (Vercel may supply `string | string[]`). */
export function getQueryString(req: VercelRequest, key: string): string | undefined {
  const queryValue = req.query[key];
  if (typeof queryValue === 'string') return queryValue;
  if (Array.isArray(queryValue) && typeof queryValue[0] === 'string') return queryValue[0];
  return undefined;
}
