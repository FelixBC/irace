/**
 * POST /api/user — Upsert Strava user and issue session (server-side only; no secrets in client).
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

  const body = req.body || {};
  const { name, email, image, stravaId, stravaTokens } = body;

  if (!stravaId || !stravaTokens?.access_token) {
    return res.status(400).json({ error: 'stravaId and stravaTokens are required' });
  }

  const { Client } = await import('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
  });

  try {
    await client.connect();

    const userId = `user_${stravaId}`;
    const emailSafe = email || `strava_${stravaId}@users.irace.invalid`;
    const imageSafe = image || 'https://via.placeholder.com/150';
    const tokenJson = JSON.stringify({
      access_token: stravaTokens.access_token,
      refresh_token: stravaTokens.refresh_token,
      expires_at: stravaTokens.expires_at,
      expires_in: stravaTokens.expires_in,
    });

    const userResult = await client.query(
      `
      INSERT INTO "User" (
        "id", "name", "email", "image", "stravaId", "stravaTokens", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW(), NOW())
      ON CONFLICT ("stravaId")
      DO UPDATE SET
        "name" = EXCLUDED."name",
        "email" = EXCLUDED."email",
        "image" = EXCLUDED."image",
        "stravaTokens" = EXCLUDED."stravaTokens",
        "updatedAt" = NOW()
      RETURNING "id", "name", "email", "image", "stravaId", "stravaTokens"
    `,
      [userId, name || 'Strava User', emailSafe, imageSafe, String(stravaId), tokenJson]
    );

    const user = userResult.rows[0];

    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const sessionId = sessionToken;

    await client.query(
      `
      INSERT INTO "Session" ("id", "sessionToken", "userId", "expires")
      VALUES ($1, $2, $3, $4)
    `,
      [sessionId, sessionToken, user.id, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
    );

    return res.status(200).json({
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        stravaId: user.stravaId,
      },
    });
  } catch (err) {
    console.error('POST /api/user error:', err);
    return res.status(500).json({ error: 'Failed to create session', details: err.message });
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}
