import { StravaTokens, StravaActivity, StravaAthlete } from '@/types';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export class StravaAPI {
  private accessToken: string;
  private refreshToken: string;
  private expiresAt: number;

  constructor(tokens: StravaTokens) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.expiresAt = tokens.expires_at;
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Strava access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.expiresAt = data.expires_at;
  }

  private async makeAuthenticatedRequest(endpoint: string): Promise<any> {
    // Check if token needs refresh
    if (Date.now() >= this.expiresAt * 1000) {
      await this.refreshAccessToken();
    }

    const response = await fetch(`${STRAVA_API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAthlete(): Promise<StravaAthlete> {
    return this.makeAuthenticatedRequest('/athlete');
  }

  async getActivities(page: number = 1, perPage: number = 30): Promise<StravaActivity[]> {
    return this.makeAuthenticatedRequest(`/athlete/activities?page=${page}&per_page=${perPage}`);
  }

  async getActivity(id: number): Promise<StravaActivity> {
    return this.makeAuthenticatedRequest(`/activities/${id}`);
  }

  async getActivitiesAfterDate(after: Date): Promise<StravaActivity[]> {
    const afterTimestamp = Math.floor(after.getTime() / 1000);
    return this.makeAuthenticatedRequest(`/athlete/activities?after=${afterTimestamp}`);
  }

  async getActivitiesByDateRange(startDate: Date, endDate: Date): Promise<StravaActivity[]> {
    const afterTimestamp = Math.floor(startDate.getTime() / 1000);
    const beforeTimestamp = Math.floor(endDate.getTime() / 1000);
    return this.makeAuthenticatedRequest(
      `/athlete/activities?after=${afterTimestamp}&before=${beforeTimestamp}`
    );
  }

  async getUpdatedTokens(): Promise<StravaTokens> {
    return {
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
      expires_at: this.expiresAt,
      expires_in: this.expiresAt - Math.floor(Date.now() / 1000),
    };
  }
}

export function getStravaAuthUrl(): string {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/strava`;
  const scope = 'read,activity:read_all';
  
  return `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&approval_prompt=force`;
}

export async function exchangeCodeForTokens(code: string): Promise<StravaTokens> {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    expires_in: data.expires_in,
  };
}

export function mapStravaActivityToActivity(stravaActivity: StravaActivity) {
  // Map Strava activity type to our Sport enum
  const sportTypeMap: Record<string, 'RUNNING' | 'CYCLING' | 'SWIMMING'> = {
    Run: 'RUNNING',
    Ride: 'CYCLING',
    Swim: 'SWIMMING',
    VirtualRide: 'CYCLING',
    EBikeRide: 'CYCLING',
  };

  const sport = sportTypeMap[stravaActivity.type] || 'RUNNING';
  const distance = stravaActivity.distance / 1000; // Convert meters to kilometers

  return {
    stravaActivityId: stravaActivity.id.toString(),
    sport,
    distance,
    duration: stravaActivity.moving_time,
    date: new Date(stravaActivity.start_date),
  };
}

export function isActivityRelevant(activity: StravaActivity): boolean {
  const relevantTypes = ['Run', 'Ride', 'Swim', 'VirtualRide', 'EBikeRide'];
  return relevantTypes.includes(activity.type) && !activity.manual;
} 