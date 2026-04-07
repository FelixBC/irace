import { normalizeSports } from './normalizeSports.js';
import { closeChallengeIfEnded, maybeMarkParticipantFinished } from './challengeLifecycle.js';
import { createLogger } from './logger.js';

const log = createLogger('stravaSync');

export async function handleStravaSync(req, res) {
  log.debug('request', req.method, req.body?.challengeId);

  if (req.method !== 'POST') {
    log.warn('method not allowed', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, challengeId } = req.body;

    if (!userId) {
      log.warn('missing userId');
      return res.status(400).json({ error: 'User ID is required' });
    }

    log.debug('sync start', { userId, challengeId });

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    });

    try {
      await client.connect();
      log.debug('db connected');

      const userResult = await client.query(
        `
        SELECT "stravaTokens", "stravaId" 
        FROM "User" 
        WHERE "id" = $1
      `,
        [userId]
      );

      if (userResult.rows.length === 0) {
        await client.end();
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];
      const stravaTokens = user.stravaTokens;

      if (!stravaTokens || !stravaTokens.access_token) {
        await client.end();
        return res.status(400).json({ error: 'User not connected to Strava' });
      }

      let challenge = null;
      if (challengeId) {
        const challengeResult = await client.query(
          `
          SELECT "id", "sports", "startDate", "endDate", "sportGoals", "status"
          FROM "Challenge" 
          WHERE "id" = $1
        `,
          [challengeId]
        );

        if (challengeResult.rows.length > 0) {
          challenge = challengeResult.rows[0];
        }
      }

      log.debug('fetching Strava activities');
      const activitiesResponse = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=200', {
        headers: {
          Authorization: `Bearer ${stravaTokens.access_token}`,
        },
      });

      if (!activitiesResponse.ok) {
        const errorData = await activitiesResponse.json();
        log.error('Strava activities fetch failed', errorData);
        await client.end();
        return res.status(500).json({ error: 'Failed to fetch Strava activities', details: errorData });
      }

      const activities = await activitiesResponse.json();
      log.debug('activities fetched', activities.length);

      let relevantActivities = activities;
      if (challenge) {
        const challengeStartDate = new Date(challenge.startDate);
        const challengeEndDate = new Date(challenge.endDate);
        const challengeSports = normalizeSports(challenge.sports);

        relevantActivities = activities.filter((activity) => {
          const activityDate = new Date(activity.start_date);
          const isInDateRange = activityDate >= challengeStartDate && activityDate <= challengeEndDate;
          const isRelevantSport = challengeSports.includes(activity.sport_type);
          return isInDateRange && isRelevantSport;
        });

        log.debug('filtered for challenge', relevantActivities.length);
      }

      let syncedCount = 0;
      let totalDistance = 0;

      for (const activity of relevantActivities) {
        try {
          const existingActivityResult = await client.query(
            `
            SELECT "id" 
            FROM "Activity" 
            WHERE "stravaActivityId" = $1
          `,
            [activity.id.toString()]
          );

          if (existingActivityResult.rows.length > 0) {
            log.debug('activity already synced, skip', activity.id);
            continue;
          }

          const sportMapping = {
            Run: 'RUNNING',
            Ride: 'CYCLING',
            Swim: 'SWIMMING',
            Walk: 'WALKING',
            Hike: 'HIKING',
            Yoga: 'YOGA',
            WeightTraining: 'WEIGHT_TRAINING',
          };

          const sport = sportMapping[activity.sport_type] || 'RUNNING';
          const distance = activity.distance / 1000;
          const duration = activity.moving_time;

          const activityId = `activity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

          await client.query(
            `
            INSERT INTO "Activity" (
              "id", "stravaActivityId", "userId", "challengeId", "sport",
              "distance", "duration", "date", "synced", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `,
            [
              activityId,
              activity.id.toString(),
              userId,
              challengeId || null,
              sport,
              distance,
              duration,
              new Date(activity.start_date),
              true,
              new Date(),
              new Date(),
            ]
          );

          totalDistance += distance;
          syncedCount += 1;
        } catch (activityError) {
          log.error('activity processing error', activity.id, activityError);
        }
      }

      if (challengeId && syncedCount > 0) {
        await client.query('BEGIN');
        try {
          const ended = await closeChallengeIfEnded(client, challengeId);
          if (!ended) {
            await client.query(
              `
              UPDATE "Participation" 
              SET 
                "currentDistance" = "currentDistance" + $1,
                "lastActivityDate" = NOW(),
                "updatedAt" = NOW()
              WHERE "userId" = $2 AND "challengeId" = $3
            `,
              [totalDistance, userId, challengeId]
            );

            await maybeMarkParticipantFinished(client, { challengeId, userId });
            log.info('participation distance updated', {
              userId,
              challengeId,
              deltaKm: totalDistance.toFixed(2),
            });
          }
          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK').catch(() => {});
          throw e;
        }
      }

      await client.end();
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
      try {
        await client.end();
      } catch (e) {
        log.warn('pg client close failed', e?.message ?? e);
      }
      return res.status(500).json({
        error: 'Failed to sync Strava activities',
        details: dbError.message,
      });
    }
  } catch (error) {
    log.error('sync handler error', error);
    return res.status(500).json({
      error: 'Strava sync failed',
      details: error.message,
    });
  }
}

const logDisconnect = createLogger('stravaDisconnect');

export async function handleStravaDisconnect(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
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

  const sessionToken = authHeader.slice(7);
  const { Client } = await import('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
  });

  try {
    await client.connect();

    const sessionResult = await client.query(
      `SELECT s."userId", u."stravaTokens"
       FROM "Session" s
       JOIN "User" u ON u."id" = s."userId"
       WHERE s."sessionToken" = $1 AND s."expires" > NOW()`,
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const { userId, stravaTokens } = sessionResult.rows[0];
    const tokens = stravaTokens;

    if (tokens?.access_token) {
      const deauthRes = await fetch('https://www.strava.com/oauth/deauthorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ access_token: tokens.access_token }),
      });
      if (!deauthRes.ok) {
        const text = await deauthRes.text();
        logDisconnect.warn('Strava deauthorize non-OK', deauthRes.status, text.slice(0, 200));
      }
    }

    await client.query(`DELETE FROM "Activity" WHERE "userId" = $1`, [userId]);
    await client.query(`UPDATE "User" SET "stravaTokens" = NULL, "updatedAt" = NOW() WHERE "id" = $1`, [userId]);

    return res.status(200).json({ success: true });
  } catch (err) {
    logDisconnect.error('disconnect error', err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}

const logRefresh = createLogger('stravaRefresh');

export async function handleStravaRefreshToken(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
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

  const sessionToken = authHeader.slice(7);
  const { Client } = await import('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
  });

  try {
    await client.connect();

    const sessionResult = await client.query(
      `SELECT s."userId", u."stravaTokens"
       FROM "Session" s
       JOIN "User" u ON u."id" = s."userId"
       WHERE s."sessionToken" = $1 AND s."expires" > NOW()`,
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const row = sessionResult.rows[0];
    const tokens = row.stravaTokens;
    if (!tokens?.refresh_token) {
      return res.status(400).json({ error: 'No refresh token stored' });
    }

    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      logRefresh.error('token refresh failed', tokenResponse.status, text.slice(0, 200));
      return res.status(502).json({ error: 'Strava token refresh failed' });
    }

    const data = await tokenResponse.json();
    const newTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      expires_in: data.expires_in,
    };

    await client.query(`UPDATE "User" SET "stravaTokens" = $1::jsonb, "updatedAt" = NOW() WHERE "id" = $2`, [
      JSON.stringify(newTokens),
      row.userId,
    ]);

    return res.status(200).json({ stravaTokens: newTokens });
  } catch (err) {
    logRefresh.error('refresh handler error', err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}
