import { createFreshPrismaClient } from '../lib/prisma.js';
import { resolveBearerUserId } from '../lib/authSession.js';

/**
 * POST /api/push/unsubscribe — Remove stored subscription (by endpoint) for current user.
 * Body: { endpoint }
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
    const { endpoint } = body;
    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint' });
    }

    const result = await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });

    return res.status(200).json({ ok: true, removed: result.count });
  } catch (err) {
    console.error('push/unsubscribe:', err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
