import { normalizeSports } from './normalizeSports.js';
import { getValidStravaAccessToken } from './stravaTokenRefresh.js';
import { closeChallengeIfEnded, maybeMarkParticipantFinished } from './challengeLifecycle.js';
import { createLogger } from './logger.js';

const log = createLogger('stravaWebhook');

const SPORT_MAP = {
  Run: 'RUNNING',
  Ride: 'CYCLING',
  Swim: 'SWIMMING',
  Walk: 'WALKING',
  Hike: 'HIKING',
  Yoga: 'YOGA',
  WeightTraining: 'WEIGHT_TRAINING',
};

/**
 * Strava subscription validation (GET). Echo hub.challenge as JSON.
 * @param {Record<string, string | string[] | undefined>} query
 */
export function handleStravaWebhookVerification(query) {
  const expected = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN?.trim();
  if (!expected) {
    return { status: 503, body: { error: 'STRAVA_WEBHOOK_VERIFY_TOKEN is not set' } };
  }

  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  if (mode === 'subscribe' && token === expected && typeof challenge === 'string' && challenge.length > 0) {
    return { status: 200, body: { 'hub.challenge': challenge } };
  }

  return { status: 403, body: { error: 'Forbidden' } };
}

/**
 * Process a Strava webhook POST body (see https://developers.strava.com/docs/webhooks/).
 */
export async function processStravaWebhookEvent(payload) {
  if (!payload || typeof payload !== 'object') return;

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const { Client } = await import('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
  });

  try {
    await client.connect();

    const objectType = payload.object_type;
    const aspectType = payload.aspect_type;
    const objectId = payload.object_id;
    const ownerId = payload.owner_id;
    const updates = payload.updates && typeof payload.updates === 'object' ? payload.updates : {};

    if (objectType === 'athlete' && aspectType === 'update' && updates.authorized === 'false') {
      await client.query(`UPDATE "User" SET "stravaTokens" = NULL, "updatedAt" = NOW() WHERE "stravaId" = $1`, [
        String(ownerId),
      ]);
      log.info('athlete deauthorized', { ownerId });
      return;
    }

    if (objectType !== 'activity' || objectId == null || ownerId == null) {
      return;
    }

    const stravaId = String(ownerId);

    if (aspectType === 'delete') {
      await client.query(`DELETE FROM "Activity" WHERE "stravaActivityId" = $1`, [String(objectId)]);
      log.info('activity deleted', { objectId });
      return;
    }

    if (aspectType !== 'create' && aspectType !== 'update') {
      return;
    }

    const userResult = await client.query(
      `SELECT "id", "stravaTokens" FROM "User" WHERE "stravaId" = $1 LIMIT 1`,
      [stravaId]
    );
    if (userResult.rows.length === 0) {
      log.debug('no local user for stravaId', stravaId);
      return;
    }

    const userRow = userResult.rows[0];
    const userId = userRow.id;

    const accessToken = await getValidStravaAccessToken(client, userRow);

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

    const activity = await actRes.json();

    const existing = await client.query(`SELECT "id" FROM "Activity" WHERE "stravaActivityId" = $1`, [
      String(objectId),
    ]);
    const isNew = existing.rows.length === 0;

    const sport = SPORT_MAP[activity.sport_type] || 'RUNNING';
    const distanceKm = activity.distance != null ? activity.distance / 1000 : 0;
    const duration = activity.moving_time ?? 0;
    const startDate = new Date(activity.start_date);

    if (isNew) {
      const activityId = `activity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await client.query(
        `
        INSERT INTO "Activity" (
          "id", "stravaActivityId", "userId", "challengeId", "sport",
          "distance", "duration", "date", "synced", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, NULL, $4, $5, $6, $7, true, NOW(), NOW())
      `,
        [activityId, String(objectId), userId, sport, distanceKm, duration, startDate]
      );

      const challRes = await client.query(
        `
        SELECT c."id", c."startDate", c."endDate", c."sports", c."status"
        FROM "Challenge" c
        INNER JOIN "Participation" p ON p."challengeId" = c.id
        WHERE p."userId" = $1 AND p."status" = 'ACTIVE'
      `,
        [userId]
      );

      for (const row of challRes.rows) {
        // Freeze lifecycle: if ended, close and do not apply progress changes.
        if (new Date(row.endDate) <= new Date()) {
          await closeChallengeIfEnded(client, row.id);
          continue;
        }
        if (row.status && row.status !== 'ACTIVE') continue;

        const start = new Date(row.startDate);
        const end = new Date(row.endDate);
        if (startDate < start || startDate > end) continue;

        const sports = normalizeSports(row.sports);
        const mappedSport = SPORT_MAP[activity.sport_type] || 'RUNNING';
        if (!sports.includes(mappedSport)) continue;

        await client.query('BEGIN');
        try {
          const ended = await closeChallengeIfEnded(client, row.id);
          if (ended) {
            await client.query('COMMIT');
            continue;
          }

          await client.query(
            `
            UPDATE "Participation"
            SET
              "currentDistance" = "currentDistance" + $1,
              "lastActivityDate" = $2,
              "lastActivityAt" = $2,
              "updatedAt" = NOW()
            WHERE "userId" = $3 AND "challengeId" = $4
          `,
            [distanceKm, startDate, userId, row.id]
          );

          await maybeMarkParticipantFinished(client, { challengeId: row.id, userId });
          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK').catch(() => {});
          throw e;
        }
      }

      log.info('activity created', { objectId, userId });
    } else {
      await client.query(
        `
        UPDATE "Activity"
        SET
          "sport" = $2,
          "distance" = $3,
          "duration" = $4,
          "date" = $5,
          "synced" = true,
          "updatedAt" = NOW()
        WHERE "stravaActivityId" = $1
      `,
        [String(objectId), sport, distanceKm, duration, startDate]
      );
      log.info('activity updated', { objectId });
    }
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}
