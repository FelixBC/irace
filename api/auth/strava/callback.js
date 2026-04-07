import { createLogger } from '../../../server/logger.js';

const log = createLogger('stravaCallback');

function getFrontendBaseUrl() {
  const explicit = process.env.FRONTEND_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  // Stable production hostname (Vercel injects); prefer over VERCEL_URL (unique per deployment)
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return production.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  return 'http://localhost:5173';
}

/** Must match the redirect_uri sent to Strava on /oauth/authorize (RFC 6749). */
function getStravaRedirectUri() {
  return `${getFrontendBaseUrl()}/api/auth/strava/callback`;
}

export default async function handler(req, res) {
  log.debug('OAuth callback', req.method);

  if (req.method !== 'GET') {
    log.warn('method not allowed', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;

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
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: getStravaRedirectUri(),
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      log.warn('token exchange failed', tokenResponse.status, errorText.slice(0, 200));
      return res.status(400).json({ error: 'Token exchange failed' });
    }

    const tokens = await tokenResponse.json();
    log.debug('tokens received');

    // Get athlete info
    log.debug('fetching athlete profile');
    const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!athleteResponse.ok) {
      log.warn('athlete fetch failed', athleteResponse.status);
      return res.status(400).json({ error: 'Failed to fetch athlete info' });
    }

    const athlete = await athleteResponse.json();
    log.info('Strava athlete linked', { stravaId: athlete.id });

    // Use native pg client to avoid Prisma prepared statement issues
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });

    try {
      await client.connect();
      log.debug('db connected');

      // Create user using raw SQL
      const userId = `user_${athlete.id}`;
      log.debug('upsert user', userId);

      // Create or update user using raw SQL
      const userResult = await client.query(`
        INSERT INTO "User" (
          "id", "name", "email", "image", "stravaId", "stravaTokens", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT ("stravaId") 
        DO UPDATE SET
          "name" = EXCLUDED."name",
          "image" = EXCLUDED."image",
          "stravaTokens" = EXCLUDED."stravaTokens",
          "updatedAt" = EXCLUDED."updatedAt"
        RETURNING *
      `, [
        userId,
        `${athlete.firstname} ${athlete.lastname}`,
        `strava_${athlete.id}@example.com`,
        athlete.profile || 'https://via.placeholder.com/150',
        athlete.id.toString(),
        JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
          expires_in: tokens.expires_in
        }),
        new Date(),
        new Date()
      ]);

      const user = userResult.rows[0];
      log.info('user saved', { userId: user.id });

      // Create session using raw SQL
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      log.debug('creating session');

      const sessionResult = await client.query(`
        INSERT INTO "Session" (
          "id", "sessionToken", "userId", "expires"
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [
        sessionToken,
        sessionToken,
        user.id,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      ]);

      const session = sessionResult.rows[0];
      log.debug('session created');

      await client.end();
      log.debug('db disconnected');

      const frontendUrl = getFrontendBaseUrl();
      
      // Check if there's a state parameter for return URL
      const state = req.query.state;
      let redirectUrl;
      
      if (state) {
        const returnTo = decodeURIComponent(state);
        redirectUrl = `${frontendUrl}${returnTo}?session=${sessionToken}`;
        log.debug('redirect with state', returnTo);
      } else {
        redirectUrl = `${frontendUrl}?session=${sessionToken}`;
        log.debug('redirect home');
      }

      res.redirect(302, redirectUrl);

    } catch (dbError) {
      log.error('database error', dbError);
      try {
        await client.end();
      } catch (e) {
        log.warn('pg client close failed', e?.message ?? e);
      }
      return res.status(500).json({
        error: 'Failed to create user/session',
        details: dbError.message
      });
    }

  } catch (error) {
    log.error('OAuth callback failed', error);
    return res.status(500).json({
      error: 'OAuth callback failed',
      details: error.message
    });
  }
}