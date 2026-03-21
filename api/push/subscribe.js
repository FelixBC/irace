import { createFreshPrismaClient } from '../lib/prisma.js';
import { resolveBearerUserId } from '../lib/authSession.js';

/**
 * POST /api/push/subscribe — Store Push API subscription for the current session user.
 * Body: { endpoint, keys: { p256dh, auth } }
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

    const body = req.body || {};
    const { endpoint, keys } = body;
    const p256dh = keys?.p256dh;
    const auth = keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: 'Missing endpoint or keys' });
    }

    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, auth, userAgent },
      update: { userId, p256dh, auth, userAgent },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('push/subscribe:', err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
