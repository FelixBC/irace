import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  handleStravaSync,
  handleStravaDisconnect,
  handleStravaRefreshToken,
} from '../../server/stravaHandlers.js';
import { getQueryString } from '../../server/vercelQuery.js';

/**
 * /api/strava/:action — sync | disconnect | refresh-token (single fn for Vercel Hobby limits).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = getQueryString(req, 'action') ?? '';

  if (action === 'sync') {
    return handleStravaSync(req, res);
  }
  if (action === 'disconnect') {
    return handleStravaDisconnect(req, res);
  }
  if (action === 'refresh-token') {
    return handleStravaRefreshToken(req, res);
  }

  return res.status(404).json({ error: 'Unknown Strava action' });
}
