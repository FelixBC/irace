/**
 * POST /api/auth/refresh — mint a new access JWT using a valid refresh token.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Prisma } from '@prisma/client';
import { createLogger } from '../../server/logger.js';
import { createFreshPrismaClient } from '../../server/prisma.js';
import { applyOptionalInsecureTlsFromEnv } from '../../server/optionalInsecureTls.js';
import { applyCors } from '../../server/cors.js';
import { hashOpaqueToken, signAccessToken, ACCESS_TOKEN_TTL_SEC } from '../../server/authTokens.js';
import { parseVercelPostJsonObject } from '../../server/parseVercelPostJson.js';

const log = createLogger('authRefresh');

/** Row shape after `prisma generate` matches `schema.prisma` Session; explicit so TS stays correct if editor lags. */
type SessionRefreshRow = { id: string; userId: string; refreshExpiresAt: Date };

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

  const parsed = parseVercelPostJsonObject<{ refreshToken?: string }>(req, 'authRefresh', log.warn.bind(log));
  if (!parsed.ok) {
    const message =
      parsed.reason === 'invalid_json' ? 'Invalid JSON body' : 'Request body must be a JSON object';
    return res.status(400).json({ error: message });
  }
  const { refreshToken } = parsed.data;
  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  applyOptionalInsecureTlsFromEnv();
  const prisma = createFreshPrismaClient();
  const h = hashOpaqueToken(refreshToken);

  try {
    const session = (await prisma.session.findUnique({
      // `as unknown as …`: satisfies strict TS when the editor's @prisma/client types lag `schema.prisma` (run `npx prisma generate`).
      where: { refreshTokenHash: h } as unknown as Prisma.SessionWhereUniqueInput,
    })) as SessionRefreshRow | null;

    if (!session || session.refreshExpiresAt <= new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const accessToken = signAccessToken({ userId: session.userId, sessionId: session.id });
    log.debug('access token refreshed', { sessionId: session.id });

    return res.status(200).json({
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SEC,
    });
  } catch (e) {
    log.error('refresh failed', e);
    return res.status(500).json({ error: 'Refresh failed' });
  } finally {
    await prisma.$disconnect().catch((err) => {
      log.warn('prisma disconnect failed', err);
    });
  }
}
