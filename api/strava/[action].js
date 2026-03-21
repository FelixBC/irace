import {
  handleStravaSync,
  handleStravaDisconnect,
  handleStravaRefreshToken,
} from '../lib/stravaHandlers.js';

/**
 * /api/strava/:action — sync | disconnect | refresh-token (single fn for Vercel Hobby limits).
 */
export default async function handler(req, res) {
  const action = typeof req.query?.action === 'string' ? req.query.action : '';

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
