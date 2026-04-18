import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createFreshPrismaClient } from '../../server/prisma.js';
import { resolveBearerUserId } from '../../server/authSession.js';
import { ensureWebPushConfigured, webpush } from '../../server/webPushConfig.js';
import { createLogger } from '../../server/logger.js';
import { getQueryString } from '../../server/vercelQuery.js';
import { applyCors } from '../../server/cors.js';

const log = createLogger('push');

type SubscribeBody = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

/**
 * POST /api/push/:action — subscribe | unsubscribe | test (one serverless fn for Hobby plan limits).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = getQueryString(req, 'action') ?? '';
  if (!['subscribe', 'unsubscribe', 'test'].includes(action)) {
    return res.status(404).json({ error: 'Unknown action' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = createFreshPrismaClient();
  try {
    const userId = await resolveBearerUserId(prisma, req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (action === 'subscribe') {
      const body = (req.body ?? {}) as SubscribeBody;
      const { endpoint, keys } = body;
      const p256dh = keys?.p256dh;
      const auth = keys?.auth;

      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({ error: 'Missing endpoint or keys' });
      }

      const ua = req.headers['user-agent'];
      const userAgent = typeof ua === 'string' ? ua : null;

      await prisma.pushSubscription.upsert({
        where: { endpoint },
        create: { userId, endpoint, p256dh, auth, userAgent },
        update: { userId, p256dh, auth, userAgent },
      });

      return res.status(200).json({ ok: true });
    }

    if (action === 'unsubscribe') {
      const body = (req.body ?? {}) as { endpoint?: string };
      const { endpoint } = body;
      if (!endpoint) {
        return res.status(400).json({ error: 'Missing endpoint' });
      }

      const result = await prisma.pushSubscription.deleteMany({
        where: { userId, endpoint },
      });

      return res.status(200).json({ ok: true, removed: result.count });
    }

    try {
      ensureWebPushConfigured();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Web Push not configured';
      return res.status(503).json({ error: msg });
    }

    const body = (req.body ?? {}) as { title?: string; body?: string; url?: string };
    const title = typeof body.title === 'string' ? body.title : 'iRace';
    const message = typeof body.body === 'string' ? body.body : 'Test notification';
    const url = typeof body.url === 'string' ? body.url : '/';

    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subs.length === 0) {
      return res.status(400).json({ error: 'No push subscriptions for this account' });
    }

    const payload = JSON.stringify({ title, body: message, url });
    let sent = 0;
    const errors: Array<{ endpoint: string; message: string }> = [];

    for (const row of subs) {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };
      try {
        await webpush.sendNotification(subscription, payload, { TTL: 60 });
        sent += 1;
      } catch (err: unknown) {
        const statusCode =
          err && typeof err === 'object' && 'statusCode' in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: row.id } }).catch(() => {});
        } else {
          errors.push({
            endpoint: row.endpoint.slice(0, 48),
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    }

    return res.status(200).json({ ok: true, sent, errors });
  } catch (err) {
    log.error('handler error', action, err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
