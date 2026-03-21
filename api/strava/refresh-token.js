/**
 * POST /api/strava/refresh-token — Refresh Strava tokens using server-side secret (never ship client_secret to browsers).
 */
export default async function handler(req, res) {
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
      console.error('Strava refresh failed:', tokenResponse.status, text);
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
    console.error('refresh-token:', err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}
