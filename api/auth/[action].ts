/**
 * Dynamic auth route to keep Vercel function count low:
 * - POST /api/auth/exchange
 * - POST /api/auth/refresh
 * - POST /api/auth/logout
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Prisma } from '@prisma/client';
import { createLogger } from '../../server/logger.js';
import { createFreshPrismaClient } from '../../server/prisma.js';
import { applyOptionalInsecureTlsFromEnv } from '../../server/optionalInsecureTls.js';
import { applyCors } from '../../server/cors.js';
import { hashOpaqueToken, signAccessToken, ACCESS_TOKEN_TTL_SEC, verifyAccessToken } from '../../server/authTokens.js';
import { parseVercelPostJsonObject } from '../../server/parseVercelPostJson.js';

const logExchange = createLogger('authExchange');
const logRefresh = createLogger('authRefresh');

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

/** Row shape after `prisma generate` matches `schema.prisma` Session; explicit so TS stays correct if editor lags. */
type SessionRefreshRow = { id: string; userId: string; refreshExpiresAt: Date };

function getAction(req: VercelRequest): string | null {
  const action = (req.query?.action ?? null) as unknown;
  if (typeof action === 'string') return action;
  if (Array.isArray(action) && typeof action[0] === 'string') return action[0];
  return null;
}

async function handleExchange(req: VercelRequest, res: VercelResponse) {
  const parsed = parseVercelPostJsonObject<{ exchangeCode?: string }>(
    req,
    'authExchange',
    logExchange.warn.bind(logExchange)
  );
  if (!parsed.ok) {
    const reason = (parsed as { ok: false; reason: string }).reason;
    const message = reason === 'invalid_json' ? 'Invalid JSON body' : 'Request body must be a JSON object';
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
      logExchange.warn('invalid or expired exchange');
      return res.status(401).json({ error: 'Invalid or expired exchange code' });
    }

    if (!session.pendingRefreshToken) {
      logExchange.warn('exchange already consumed');
      return res.status(401).json({ error: 'Exchange code already used' });
    }

    const refreshPlain = session.pendingRefreshToken;
    if (hashOpaqueToken(refreshPlain) !== session.refreshTokenHash) {
      logExchange.error('session refresh hash mismatch');
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

    logExchange.info('exchange ok', { userId: u.id });

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
    logExchange.error('exchange failed', e);
    return res.status(500).json({ error: 'Exchange failed' });
  } finally {
    await prisma.$disconnect().catch((err) => {
      logExchange.warn('prisma disconnect failed', err);
    });
  }
}

async function handleRefresh(req: VercelRequest, res: VercelResponse) {
  const parsed = parseVercelPostJsonObject<{ refreshToken?: string }>(
    req,
    'authRefresh',
    logRefresh.warn.bind(logRefresh)
  );
  if (!parsed.ok) {
    const reason = (parsed as { ok: false; reason: string }).reason;
    const message = reason === 'invalid_json' ? 'Invalid JSON body' : 'Request body must be a JSON object';
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
    logRefresh.debug('access token refreshed', { sessionId: session.id });

    return res.status(200).json({
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SEC,
    });
  } catch (e) {
    logRefresh.error('refresh failed', e);
    return res.status(500).json({ error: 'Refresh failed' });
  } finally {
    await prisma.$disconnect().catch((err) => {
      logRefresh.warn('prisma disconnect failed', err);
    });
  }
}

const logLogout = createLogger('authLogout');

async function handleLogout(req: VercelRequest, res: VercelResponse) {
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
    logLogout.debug('session revoked', claims.sessionId);
    return res.status(200).json({ ok: true });
  } catch (e) {
    logLogout.error('logout failed', e);
    return res.status(500).json({ error: 'Logout failed' });
  } finally {
    await prisma.$disconnect().catch((err) => {
      logLogout.warn('prisma disconnect failed', err);
    });
  }
}

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

  const action = getAction(req);
  if (action === 'exchange') return handleExchange(req, res);
  if (action === 'refresh') return handleRefresh(req, res);
  if (action === 'logout') return handleLogout(req, res);

  return res.status(404).json({ error: 'Not Found' });
}

