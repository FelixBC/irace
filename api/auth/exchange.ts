/**
 * POST /api/auth/exchange — one-time OAuth handoff: exchange code → access + refresh tokens + user.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Prisma } from '@prisma/client';
import { createLogger } from '../../server/logger.js';
import { createFreshPrismaClient } from '../../server/prisma.js';
import { applyOptionalInsecureTlsFromEnv } from '../../server/optionalInsecureTls.js';
import { applyCors } from '../../server/cors.js';
import { hashOpaqueToken, signAccessToken, ACCESS_TOKEN_TTL_SEC } from '../../server/authTokens.js';
import { parseVercelPostJsonObject } from '../../server/parseVercelPostJson.js';

const log = createLogger('authExchange');

type ExchangeSessionRow = {
  id: string;
  refreshTokenHash: string;
  pendingRefreshToken: string | null;
  exchangeExpiresAt: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    stravaId: string | null;
    stravaTokens: Prisma.JsonValue | null;
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
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const parsed = parseVercelPostJsonObject<{ exchangeCode?: string }>(req, 'authExchange', log.warn.bind(log));
  if (!parsed.ok) {
    const message =
      parsed.reason === 'invalid_json' ? 'Invalid JSON body' : 'Request body must be a JSON object';
    return res.status(400).json({ error: message });
  }
  const { exchangeCode } = parsed.data;
  if (!exchangeCode || typeof exchangeCode !== 'string') {
    return res.status(400).json({ error: 'exchangeCode is required' });
  }

  applyOptionalInsecureTlsFromEnv();
  const prisma = createFreshPrismaClient();
  const exchangeHash = hashOpaqueToken(exchangeCode);

  try {
    const session = (await prisma.session.findUnique({
      // `as unknown as …`: supports strict TS when editor Prisma types lag `schema.prisma`.
      where: { exchangeTokenHash: exchangeHash } as unknown as Prisma.SessionWhereUniqueInput,
      include: { user: true },
    })) as ExchangeSessionRow | null;

    if (!session || !session.exchangeExpiresAt || session.exchangeExpiresAt <= new Date()) {
      log.warn('invalid or expired exchange');
      return res.status(401).json({ error: 'Invalid or expired exchange code' });
    }

    if (!session.pendingRefreshToken) {
      log.warn('exchange already consumed');
      return res.status(401).json({ error: 'Exchange code already used' });
    }

    const refreshPlain = session.pendingRefreshToken;
    if (hashOpaqueToken(refreshPlain) !== session.refreshTokenHash) {
      log.error('session refresh hash mismatch');
      return res.status(500).json({ error: 'Session integrity error' });
    }

    await prisma.session.update({
      where: { id: session.id },
      data: {
        pendingRefreshToken: null,
        exchangeTokenHash: null,
        exchangeExpiresAt: null,
      } as unknown as Prisma.SessionUpdateInput,
    });

    const u = session.user;
    const accessToken = signAccessToken({ userId: u.id, sessionId: session.id });

    log.info('exchange ok', { userId: u.id });

    return res.status(200).json({
      accessToken,
      refreshToken: refreshPlain,
      expiresIn: ACCESS_TOKEN_TTL_SEC,
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
  } catch (e) {
    log.error('exchange failed', e);
    return res.status(500).json({ error: 'Exchange failed' });
  } finally {
    await prisma.$disconnect().catch((err) => {
      log.warn('prisma disconnect failed', err);
    });
  }
}
