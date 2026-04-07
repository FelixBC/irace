import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions';
import {
  handleStravaWebhookVerification,
  processStravaWebhookEvent,
} from '../../server/stravaWebhookProcessor.js';
import { createLogger } from '../../server/logger.js';

const log = createLogger('stravaWebhookApi');

function parseJsonBody(req: VercelRequest): unknown {
  const raw = req.body;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw || '{}');
    } catch {
      return {};
    }
  }
  return raw ?? {};
}

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
    const body = parseJsonBody(req);
    const work = processStravaWebhookEvent(body).catch((err: unknown) => {
      log.error('async process failed', err);
    });
    waitUntil(work);
    return res.status(200).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
