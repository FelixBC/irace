import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Prisma, type ChallengeStatus, type Sport } from '@prisma/client';
import { normalizeSports } from './normalizeSports.js';
import { closeChallengeIfEnded, maybeMarkParticipantFinished } from './challengeLifecycle.js';
import { getValidStravaAccessToken } from './stravaTokenRefresh.js';
import { createFreshPrismaClient } from './prisma.js';
import { applyOptionalInsecureTlsFromEnv } from './optionalInsecureTls.js';
import { createLogger } from './logger.js';
import { mapStravaActivityTypeToSport } from '../shared/stravaSportType.js';
import { resolveBearerUserId } from './authSession.js';
import { applyCors } from './cors.js';

const log = createLogger('stravaSync');

type StravaActivitySummary = {
  id: number;
  type?: string;
  sport_type?: string;
  distance: number;
  moving_time: number;
  start_date: string;
};

function activitySportKey(activity: StravaActivitySummary): string | undefined {
  return activity.sport_type || activity.type;
}

type SyncBody = {
  challengeId?: string;
};

function jsonAccessToken(tokens: unknown): string | undefined {
  if (tokens && typeof tokens === 'object' && 'access_token' in tokens) {
    const t = (tokens as { access_token?: unknown }).access_token;
    return typeof t === 'string' ? t : undefined;
  }
  return undefined;
}

function jsonRefreshToken(tokens: unknown): string | undefined {
  if (tokens && typeof tokens === 'object' && 'refresh_token' in tokens) {
    const t = (tokens as { refresh_token?: unknown }).refresh_token;
    return typeof t === 'string' ? t : undefined;
  }
  return undefined;
}

export async function handleStravaSync(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  log.debug('request', req.method, (req.body as SyncBody | undefined)?.challengeId);

  if (req.method !== 'POST') {
    log.warn('method not allowed', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = (req.body ?? {}) as SyncBody;
    const { challengeId } = body;

    applyOptionalInsecureTlsFromEnv();

    const prisma = createFreshPrismaClient();

    try {
      log.debug('db connected');

      const userId = await resolveBearerUserId(prisma, req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      log.debug('sync start', { userId, challengeId });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, stravaTokens: true, stravaId: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.stravaTokens) {
        return res.status(400).json({ error: 'User not connected to Strava' });
      }

      const accessToken = await getValidStravaAccessToken(prisma, user);

      type ChallengeForSync = {
        id: string;
        sports: Sport[];
        startDate: Date;
        endDate: Date;
        sportGoals: Prisma.JsonValue | null;
        status: ChallengeStatus;
      };
      let challenge: ChallengeForSync | null = null;
      if (challengeId) {
        challenge = await prisma.challenge.findUnique({
          where: { id: challengeId },
          select: {
            id: true,
            sports: true,
            startDate: true,
            endDate: true,
            sportGoals: true,
            status: true,
          },
        });
      }

      log.debug('fetching Strava activities');
      const activitiesResponse = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=200', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!activitiesResponse.ok) {
        const errorData = await activitiesResponse.json();
        log.error('Strava activities fetch failed', errorData);
        return res.status(500).json({ error: 'Failed to fetch Strava activities', details: errorData });
      }

      const activities = (await activitiesResponse.json()) as StravaActivitySummary[];
      log.debug('activities fetched', activities.length);

      let relevantActivities = activities;
      if (challenge) {
        const challengeStartDate = new Date(challenge.startDate);
        const challengeEndDate = new Date(challenge.endDate);
        const challengeSports = normalizeSports(challenge.sports);

        relevantActivities = activities.filter((activity) => {
          const activityDate = new Date(activity.start_date);
          const isInDateRange = activityDate >= challengeStartDate && activityDate <= challengeEndDate;
          const mapped = mapStravaActivityTypeToSport(activitySportKey(activity));
          const isRelevantSport = challengeSports.includes(mapped);
          return isInDateRange && isRelevantSport;
        });

        log.debug('filtered for challenge', relevantActivities.length);
      }

      let syncedCount = 0;
      let totalDistance = 0;

      for (const activity of relevantActivities) {
        try {
          const existing = await prisma.activity.findUnique({
            where: { stravaActivityId: String(activity.id) },
            select: { id: true },
          });

          if (existing) {
            log.debug('activity already synced, skip', activity.id);
            continue;
          }

          const sport = mapStravaActivityTypeToSport(activitySportKey(activity));
          const distance = activity.distance / 1000;
          const duration = activity.moving_time;

          const activityId = `activity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

          await prisma.activity.create({
            data: {
              id: activityId,
              stravaActivityId: String(activity.id),
              userId,
              challengeId: challengeId || null,
              sport,
              distance,
              duration,
              date: new Date(activity.start_date),
              synced: true,
            },
          });

          totalDistance += distance;
          syncedCount += 1;
        } catch (activityError) {
          log.error('activity processing error', activity.id, activityError);
        }
      }

      if (challengeId && syncedCount > 0) {
        await prisma.$transaction(async (tx) => {
          const ended = await closeChallengeIfEnded(tx, challengeId);
          if (!ended) {
            await tx.participation.updateMany({
              where: { userId, challengeId },
              data: {
                currentDistance: { increment: totalDistance },
                lastActivityDate: new Date(),
              },
            });
            await maybeMarkParticipantFinished(tx, { challengeId, userId });
            log.info('participation distance updated', {
              userId,
              challengeId,
              deltaKm: totalDistance.toFixed(2),
            });
          }
        });
      }

      log.info('sync complete', { syncedCount, totalDistanceKm: totalDistance.toFixed(2) });

      return res.status(200).json({
        success: true,
        message: 'Strava activities synced successfully',
        syncedCount,
        totalDistance,
        activities: relevantActivities.length,
      });
    } catch (dbError) {
      log.error('database error', dbError);
      const message = dbError instanceof Error ? dbError.message : 'Unknown error';
      return res.status(500).json({
        error: 'Failed to sync Strava activities',
        details: message,
      });
    } finally {
      await prisma.$disconnect().catch((e) => {
        log.warn('prisma disconnect failed', e?.message ?? e);
      });
    }
  } catch (error) {
    log.error('sync handler error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Strava sync failed',
      details: message,
    });
  }
}

const logDisconnect = createLogger('stravaDisconnect');

export async function handleStravaDisconnect(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const prisma = createFreshPrismaClient();

  try {
    const userId = await resolveBearerUserId(prisma, req);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const userRow = await prisma.user.findUnique({
      where: { id: userId },
      select: { stravaTokens: true },
    });
    const tokens = userRow?.stravaTokens;
    const accessToken = jsonAccessToken(tokens);

    if (accessToken) {
      const deauthRes = await fetch('https://www.strava.com/oauth/deauthorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ access_token: accessToken }),
      });
      if (!deauthRes.ok) {
        const text = await deauthRes.text();
        logDisconnect.warn('Strava deauthorize non-OK', deauthRes.status, text.slice(0, 200));
      }
    }

    await prisma.activity.deleteMany({ where: { userId } });
    await prisma.user.update({
      where: { id: userId },
      data: { stravaTokens: Prisma.DbNull },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    logDisconnect.error('disconnect error', err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

const logRefresh = createLogger('stravaRefresh');

export async function handleStravaRefreshToken(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const prisma = createFreshPrismaClient();

  try {
    const userId = await resolveBearerUserId(prisma, req);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    const tokens = user.stravaTokens;
    if (!tokens || typeof tokens !== 'object' || !jsonRefreshToken(tokens)) {
      return res.status(400).json({ error: 'No refresh token stored' });
    }

    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.STRAVA_CLIENT_ID ?? '',
        client_secret: process.env.STRAVA_CLIENT_SECRET ?? '',
        grant_type: 'refresh_token',
        refresh_token: jsonRefreshToken(tokens)!,
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      logRefresh.error('token refresh failed', tokenResponse.status, text.slice(0, 200));
      return res.status(502).json({ error: 'Strava token refresh failed' });
    }

    const data = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      expires_in: number;
    };
    const newTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      expires_in: data.expires_in,
    };

    await prisma.user.update({
      where: { id: user.id },
      data: { stravaTokens: newTokens },
    });

    return res.status(200).json({ stravaTokens: newTokens });
  } catch (err) {
    logRefresh.error('refresh handler error', err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
