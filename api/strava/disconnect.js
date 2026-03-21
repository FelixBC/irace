/**
 * POST /api/strava/disconnect — Revoke Strava access (deauthorize) and remove tokens + synced activities from our DB.
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
        console.warn('Strava deauthorize non-OK:', deauthRes.status, text);
      }
    }

    await client.query(`DELETE FROM "Activity" WHERE "userId" = $1`, [userId]);
    await client.query(`UPDATE "User" SET "stravaTokens" = NULL, "updatedAt" = NOW() WHERE "id" = $1`, [userId]);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('strava/disconnect:', err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}
