import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createLogger } from '../../../server/logger.js';
import { createFreshPrismaClient } from '../../../server/prisma.js';
import { applyOptionalInsecureTlsFromEnv } from '../../../server/optionalInsecureTls.js';
import { applyCors } from '../../../server/cors.js';
import { verifyAccessToken } from '../../../server/authTokens.js';

const log = createLogger('authSession');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No valid authorization header' });
    return;
  }

  const accessToken = authHeader.substring(7);
  const claims = verifyAccessToken(accessToken);
  if (!claims) {
    res.status(401).json({ error: 'Invalid or expired access token' });
    return;
  }

  log.debug('session lookup');

  applyOptionalInsecureTlsFromEnv();

  const prisma = createFreshPrismaClient();

  try {
    const session = await prisma.session.findUnique({
      where: { id: claims.sessionId },
      include: { user: true },
    });

    if (!session || session.userId !== claims.userId) {
      log.warn('session not found or mismatch');
      res.status(401).json({ error: 'Session not found' });
      return;
    }

    if (session.refreshExpiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    log.debug('session ok', session.id);

    const u = session.user;
    res.status(200).json({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        stravaId: u.stravaId,
        stravaTokens: u.stravaTokens,
      },
      stravaTokens: u.stravaTokens,
    });
  } catch (error) {
    log.error('session validation error', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('connect')) {
      res.status(500).json({
        error: 'Session validation failed',
        details: 'Database connection issue. Please try again.',
        fallback: true,
      });
      return;
    }

    res.status(500).json({
      error: 'Session validation failed',
      details: message,
      fallback: true,
    });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
