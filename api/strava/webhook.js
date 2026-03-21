import { waitUntil } from '@vercel/functions';
import {
  handleStravaWebhookVerification,
  processStravaWebhookEvent,
} from '../../server/stravaWebhookProcessor.js';

/**
 * Strava Push Subscriptions callback — GET validates subscription, POST receives events.
 * @see https://developers.strava.com/docs/webhooks/
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const out = handleStravaWebhookVerification(req.query || {});
    return res.status(out.status).json(out.body);
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const work = processStravaWebhookEvent(body).catch((err) => {
      console.error('strava webhook process failed:', err);
    });
    waitUntil(work);
    return res.status(200).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
