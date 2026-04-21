import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions';
import {
  handleStravaWebhookVerification,
  processStravaWebhookEvent,
} from '../../server/stravaWebhookProcessor.js';
import { createLogger } from '../../server/logger.js';
import { parseVercelPostJsonObject } from '../../server/parseVercelPostJson.js';

const log = createLogger('stravaWebhookApi');

/**
 * Strava Push Subscriptions callback — GET validates subscription, POST receives events.
 * @see https://developers.strava.com/docs/webhooks/
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const out = handleStravaWebhookVerification(req.query || {});
    return res.status(out.status).json(out.body);
  }

  if (req.method === 'POST') {
    const parsed = parseVercelPostJsonObject<Record<string, unknown>>(req, 'stravaWebhook', log.warn.bind(log));
    const body: unknown = parsed.ok ? parsed.data : {};
    const work = processStravaWebhookEvent(body).catch((err: unknown) => {
      log.error('async process failed', err);
    });
    waitUntil(work);
    return res.status(200).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
