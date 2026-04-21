/**
 * POST /api/auth/logout — revoke session (requires valid access JWT).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createLogger } from '../../server/logger.js';
import { createFreshPrismaClient } from '../../server/prisma.js';
import { applyOptionalInsecureTlsFromEnv } from '../../server/optionalInsecureTls.js';
import { applyCors } from '../../server/cors.js';
import { verifyAccessToken } from '../../server/authTokens.js';

const log = createLogger('authLogout');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No valid authorization header' });
  }

  const token = authHeader.slice(7);
  const claims = verifyAccessToken(token);
  if (!claims) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }

  applyOptionalInsecureTlsFromEnv();
  const prisma = createFreshPrismaClient();

  try {
    await prisma.session.deleteMany({
      where: { id: claims.sessionId, userId: claims.userId },
    });
    log.debug('session revoked', claims.sessionId);
    return res.status(200).json({ ok: true });
  } catch (e) {
    log.error('logout failed', e);
    return res.status(500).json({ error: 'Logout failed' });
  } finally {
    await prisma.$disconnect().catch((err) => {
      log.warn('prisma disconnect failed', err);
    });
  }
}
