import type { Prisma, PrismaClient } from '@prisma/client';

type StravaTokensShape = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
};

type UserTokensRow = {
  id: string;
  stravaTokens: Prisma.JsonValue;
};

function parseTokens(raw: Prisma.JsonValue): StravaTokensShape | null {
  const tokens: unknown = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
  if (!tokens || typeof tokens !== 'object') return null;
  return tokens as StravaTokensShape;
}

/**
 * Return a valid Strava access token for a user row, refreshing when expired.
 * Persists new tokens on the User row.
 */
export async function getValidStravaAccessToken(
  db: PrismaClient | Pick<PrismaClient, 'user'>,
  userRow: UserTokensRow
): Promise<string> {
  const tokens = parseTokens(userRow.stravaTokens);
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
      client_id: process.env.STRAVA_CLIENT_ID ?? '',
      client_secret: process.env.STRAVA_CLIENT_SECRET ?? '',
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    }),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    throw new Error(`Strava token refresh failed: ${tokenResponse.status} ${text}`);
  }

  const data = (await tokenResponse.json()) as StravaTokensShape;
  const newTokens: Prisma.InputJsonValue = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    expires_in: data.expires_in,
  };

  await db.user.update({
    where: { id: userRow.id },
    data: { stravaTokens: newTokens },
  });

  return String(data.access_token ?? '');
}
