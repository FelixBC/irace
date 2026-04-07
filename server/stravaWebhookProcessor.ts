import type { VercelRequest } from '@vercel/node';
import { Prisma } from '@prisma/client';
import { normalizeSports } from './normalizeSports.js';
import { getValidStravaAccessToken } from './stravaTokenRefresh.js';
import { closeChallengeIfEnded, maybeMarkParticipantFinished } from './challengeLifecycle.js';
import { createFreshPrismaClient } from './prisma.js';
import { applyOptionalInsecureTlsFromEnv } from './optionalInsecureTls.js';
import { createLogger } from './logger.js';
import { mapStravaActivityTypeToSport } from '../shared/stravaSportType.js';

const log = createLogger('stravaWebhook');

type StravaActivityDetail = {
  type?: string;
  sport_type?: string;
  distance?: number;
  moving_time?: number;
  start_date: string;
};

function activitySportKey(activity: StravaActivityDetail): string | undefined {
  return activity.sport_type || activity.type;
}

/**
 * Strava subscription validation (GET). Echo hub.challenge as JSON.
 */
export function handleStravaWebhookVerification(query: VercelRequest['query']) {
  const expected = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN?.trim();
  if (!expected) {
    return { status: 503 as const, body: { error: 'STRAVA_WEBHOOK_VERIFY_TOKEN is not set' } };
  }

  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  if (mode === 'subscribe' && token === expected && typeof challenge === 'string' && challenge.length > 0) {
    return { status: 200 as const, body: { 'hub.challenge': challenge } };
  }

  return { status: 403 as const, body: { error: 'Forbidden' } };
}

type WebhookPayload = {
  object_type?: string;
  aspect_type?: string;
  object_id?: number | string;
  owner_id?: number | string;
  updates?: Record<string, string>;
};

/**
 * Process a Strava webhook POST body (see https://developers.strava.com/docs/webhooks/).
 */
export async function processStravaWebhookEvent(payload: unknown): Promise<void> {
  if (!payload || typeof payload !== 'object') return;

  applyOptionalInsecureTlsFromEnv();

  const prisma = createFreshPrismaClient();

  try {
    const p = payload as WebhookPayload;
    const objectType = p.object_type;
    const aspectType = p.aspect_type;
    const objectId = p.object_id;
    const ownerId = p.owner_id;
    const updates = p.updates && typeof p.updates === 'object' ? p.updates : {};

    if (objectType === 'athlete' && aspectType === 'update' && updates.authorized === 'false') {
      await prisma.user.updateMany({
        where: { stravaId: String(ownerId) },
        data: { stravaTokens: Prisma.DbNull },
      });
      log.info('athlete deauthorized', { ownerId });
      return;
    }

    if (objectType !== 'activity' || objectId == null || ownerId == null) {
      return;
    }

    const stravaId = String(ownerId);

    if (aspectType === 'delete') {
      await prisma.activity.deleteMany({
        where: { stravaActivityId: String(objectId) },
      });
      log.info('activity deleted', { objectId });
      return;
    }

    if (aspectType !== 'create' && aspectType !== 'update') {
      return;
    }

    const userRow = await prisma.user.findFirst({
      where: { stravaId },
      select: { id: true, stravaTokens: true },
    });

    if (!userRow) {
      log.debug('no local user for stravaId', stravaId);
      return;
    }

    const userId = userRow.id;

    const accessToken = await getValidStravaAccessToken(prisma, userRow);

    const actRes = await fetch(`https://www.strava.com/api/v3/activities/${objectId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (actRes.status === 404) {
      log.debug('activity not found (404)', objectId);
      return;
    }

    if (!actRes.ok) {
      const t = await actRes.text();
      log.warn('activity fetch failed', actRes.status, t.slice(0, 200));
      return;
    }

    const activity = (await actRes.json()) as StravaActivityDetail;

    const existing = await prisma.activity.findUnique({
      where: { stravaActivityId: String(objectId) },
      select: { id: true },
    });
    const isNew = !existing;

    const sport = mapStravaActivityTypeToSport(activitySportKey(activity));
    const distanceKm = activity.distance != null ? activity.distance / 1000 : 0;
    const duration = activity.moving_time ?? 0;
    const startDate = new Date(activity.start_date);

    if (isNew) {
      const activityId = `activity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await prisma.activity.create({
        data: {
          id: activityId,
          stravaActivityId: String(objectId),
          userId,
          challengeId: null,
          sport,
          distance: distanceKm,
          duration,
          date: startDate,
          synced: true,
        },
      });

      const activeParticipations = await prisma.participation.findMany({
        where: { userId, status: 'ACTIVE' },
        include: { challenge: true },
      });

      for (const part of activeParticipations) {
        const row = part.challenge;

        if (row.endDate <= new Date()) {
          await closeChallengeIfEnded(prisma, row.id);
          continue;
        }
        if (row.status !== 'ACTIVE') continue;

        const start = new Date(row.startDate);
        const end = new Date(row.endDate);
        if (startDate < start || startDate > end) continue;

        const sports = normalizeSports(row.sports);
        const mappedSport = mapStravaActivityTypeToSport(activitySportKey(activity));
        if (!sports.includes(mappedSport)) continue;

        await prisma.$transaction(async (tx) => {
          const ended = await closeChallengeIfEnded(tx, row.id);
          if (ended) return;

          await tx.participation.updateMany({
            where: { userId, challengeId: row.id },
            data: {
              currentDistance: { increment: distanceKm },
              lastActivityDate: startDate,
              lastActivityAt: startDate,
            },
          });

          await maybeMarkParticipantFinished(tx, { challengeId: row.id, userId });
        });
      }

      log.info('activity created', { objectId, userId });
    } else {
      await prisma.activity.update({
        where: { stravaActivityId: String(objectId) },
        data: {
          sport,
          distance: distanceKm,
          duration,
          date: startDate,
          synced: true,
        },
      });
      log.info('activity updated', { objectId });
    }
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
