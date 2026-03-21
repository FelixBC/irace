/**
 * Return a valid Strava access token for a user row, refreshing via refresh_token when expired.
 * Updates "User"."stravaTokens" when refresh succeeds.
 * @param {import('pg').Client} client
 * @param {{ id: string; stravaTokens: object | null }} userRow
 */
export async function getValidStravaAccessToken(client, userRow) {
  let tokens =
    typeof userRow.stravaTokens === 'string'
      ? JSON.parse(userRow.stravaTokens)
      : userRow.stravaTokens;
  if (!tokens?.refresh_token) {
    throw new Error('No Strava refresh token');
  }

  const expiresAtMs = (tokens.expires_at ?? 0) * 1000;
  if (Date.now() < expiresAtMs - 60_000 && tokens.access_token) {
    return tokens.access_token;
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
    throw new Error(`Strava token refresh failed: ${tokenResponse.status} ${text}`);
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
    userRow.id,
  ]);

  return newTokens.access_token;
}
