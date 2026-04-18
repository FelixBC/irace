/**
 * POST /api/user — Upsert Strava user and issue session.
 * Requires `Authorization: Bearer <INTERNAL_USER_UPSERT_SECRET>` (server-to-server / tooling only).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createLogger } from '../../server/logger.js';
import { createFreshPrismaClient } from '../../server/prisma.js';
import { applyCors } from '../../server/cors.js';

const log = createLogger('api/user');

type PostBody = {
  name?: string;
  email?: string;
  image?: string;
  stravaId?: string;
  stravaTokens?: {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    expires_in?: number;
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.INTERNAL_USER_UPSERT_SECRET?.trim();
  if (!secret) {
    log.warn('INTERNAL_USER_UPSERT_SECRET is not set — refusing user upsert');
    return res.status(503).json({ error: 'User upsert is not configured' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ') || authHeader.slice(7) !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = (req.body ?? {}) as PostBody;
  const { name, email, image, stravaId, stravaTokens } = body;

  if (!stravaId || !stravaTokens?.access_token) {
    return res.status(400).json({ error: 'stravaId and stravaTokens are required' });
  }

  const prisma = createFreshPrismaClient();

  try {
    const userId = `user_${stravaId}`;
    const emailSafe = email || `strava_${stravaId}@users.irace.invalid`;
    const imageSafe = image || 'https://via.placeholder.com/150';
    const tokens = {
      access_token: stravaTokens.access_token,
      refresh_token: stravaTokens.refresh_token,
      expires_at: stravaTokens.expires_at,
      expires_in: stravaTokens.expires_in,
    };

    const user = await prisma.user.upsert({
      where: { stravaId: String(stravaId) },
      create: {
        id: userId,
        name: name || 'Strava User',
        email: emailSafe,
        image: imageSafe,
        stravaId: String(stravaId),
        stravaTokens: tokens,
      },
      update: {
        name: name || 'Strava User',
        email: emailSafe,
        image: imageSafe,
        stravaTokens: tokens,
      },
    });

    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;

    await prisma.session.create({
      data: {
        id: sessionToken,
        sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(200).json({
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        stravaId: user.stravaId,
      },
    });
  } catch (err) {
    log.error('POST failed', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to create session', details: message });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
