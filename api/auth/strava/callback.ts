import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createLogger } from '../../../server/logger.js';
import { createFreshPrismaClient } from '../../../server/prisma.js';
import { applyOptionalInsecureTlsFromEnv } from '../../../server/optionalInsecureTls.js';
import { getQueryString } from '../../../server/vercelQuery.js';
import {
  EXCHANGE_CODE_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  hashOpaqueToken,
  randomTokenUrlSafe,
} from '../../../server/authTokens.js';

const log = createLogger('stravaCallback');

function getFrontendBaseUrl() {
  const explicit = process.env.FRONTEND_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return production.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  return 'http://localhost:5173';
}

/** Must match the redirect_uri sent to Strava on /oauth/authorize (RFC 6749). */
function getStravaRedirectUri() {
  return `${getFrontendBaseUrl()}/api/auth/strava/callback`;
}

type StravaAthleteJson = {
  id: number;
  firstname?: string;
  lastname?: string;
  profile?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  log.debug('OAuth callback', req.method);

  if (req.method !== 'GET') {
    log.warn('method not allowed', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const code = getQueryString(req, 'code');

    if (!code) {
      log.warn('missing authorization code');
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    log.debug('exchanging code for tokens');
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.STRAVA_CLIENT_ID ?? '',
        client_secret: process.env.STRAVA_CLIENT_SECRET ?? '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: getStravaRedirectUri(),
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      log.warn('token exchange failed', tokenResponse.status, errorText.slice(0, 200));
      return res.status(400).json({ error: 'Token exchange failed' });
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      expires_in: number;
    };
    log.debug('tokens received');

    log.debug('fetching athlete profile');
    const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!athleteResponse.ok) {
      log.warn('athlete fetch failed', athleteResponse.status);
      return res.status(400).json({ error: 'Failed to fetch athlete info' });
    }

    const athlete = (await athleteResponse.json()) as StravaAthleteJson;
    log.info('Strava athlete linked', { stravaId: athlete.id });

    applyOptionalInsecureTlsFromEnv();

    const prisma = createFreshPrismaClient();

    try {
      log.debug('db connected');

      const userId = `user_${athlete.id}`;
      log.debug('upsert user', userId);

      const first = athlete.firstname ?? '';
      const last = athlete.lastname ?? '';
      const tokenJson = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at,
        expires_in: tokens.expires_in,
      };

      const user = await prisma.user.upsert({
        where: { stravaId: String(athlete.id) },
        create: {
          id: userId,
          name: `${first} ${last}`.trim() || 'Strava User',
          email: `strava_${athlete.id}@example.com`,
          image: athlete.profile || 'https://via.placeholder.com/150',
          stravaId: String(athlete.id),
          stravaTokens: tokenJson,
        },
        update: {
          name: `${first} ${last}`.trim() || 'Strava User',
          image: athlete.profile || 'https://via.placeholder.com/150',
          stravaTokens: tokenJson,
        },
      });

      log.info('user saved', { userId: user.id });

      const refreshPlain = randomTokenUrlSafe(32);
      const exchangePlain = randomTokenUrlSafe(24);
      const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
      const exchangeExpiresAt = new Date(Date.now() + EXCHANGE_CODE_TTL_MS);

      log.debug('creating session (exchange handoff)');

      await prisma.session.create({
        data: {
          userId: user.id,
          refreshTokenHash: hashOpaqueToken(refreshPlain),
          refreshExpiresAt,
          pendingRefreshToken: refreshPlain,
          exchangeTokenHash: hashOpaqueToken(exchangePlain),
          exchangeExpiresAt,
        },
      });

      log.debug('session created');
      log.debug('db disconnected');

      const frontendUrl = getFrontendBaseUrl();

      const state = getQueryString(req, 'state');
      const encExchange = encodeURIComponent(exchangePlain);
      let redirectUrl: string;

      if (state) {
        const returnTo = decodeURIComponent(state);
        const joiner = returnTo.includes('?') ? '&' : '?';
        redirectUrl = `${frontendUrl}${returnTo}${joiner}exchange=${encExchange}`;
        log.debug('redirect with state', returnTo);
      } else {
        redirectUrl = `${frontendUrl}?exchange=${encExchange}`;
        log.debug('redirect home');
      }

      res.redirect(302, redirectUrl);
    } catch (dbError) {
      log.error('database error', dbError);
      const message = dbError instanceof Error ? dbError.message : 'Unknown error';
      return res.status(500).json({
        error: 'Failed to create user/session',
        details: message,
      });
    } finally {
      await prisma.$disconnect().catch((e) => {
        log.warn('prisma disconnect failed', e?.message ?? e);
      });
    }
  } catch (error) {
    log.error('OAuth callback failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'OAuth callback failed',
      details: message,
    });
  }
}
