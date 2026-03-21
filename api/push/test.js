import { createFreshPrismaClient } from '../lib/prisma.js';
import { resolveBearerUserId } from '../lib/authSession.js';
import { ensureWebPushConfigured, webpush } from '../lib/webPushConfig.js';

/**
 * POST /api/push/test — Send a test notification to all subscriptions for the current user (dev / QA).
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    try {
      ensureWebPushConfigured();
    } catch (e) {
      return res.status(503).json({ error: e.message || 'Web Push not configured' });
    }

    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title : 'iRace';
    const message = typeof body.body === 'string' ? body.body : 'Test notification';
    const url = typeof body.url === 'string' ? body.url : '/';

    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subs.length === 0) {
      return res.status(400).json({ error: 'No push subscriptions for this account' });
    }

    const payload = JSON.stringify({ title, body: message, url });
    let sent = 0;
    const errors = [];

    for (const row of subs) {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };
      try {
        await webpush.sendNotification(subscription, payload, { TTL: 60 });
        sent += 1;
      } catch (err) {
        const statusCode = err.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: row.id } }).catch(() => {});
        } else {
          errors.push({ endpoint: row.endpoint.slice(0, 48), message: err.message });
        }
      }
    }

    return res.status(200).json({ ok: true, sent, errors });
  } catch (err) {
    console.error('push/test:', err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
