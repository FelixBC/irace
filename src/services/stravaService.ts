import { StravaTokens, StravaActivity, StravaAthlete } from '../types';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export class StravaService {
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
        client_id: '169822',
        client_secret: 'ac6921be29eb6fadaec73dc5bd2803dc5ee1b62c',
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

  getUpdatedTokens(): StravaTokens {
    return {
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
      expires_at: this.expiresAt,
      expires_in: this.expiresAt - Math.floor(Date.now() / 1000),
    };
  }
}

export function getStravaAuthUrl(): string {
  const clientId = '169822'; // Your actual Strava Client ID
  // Use the redirect URI that matches your Strava app configuration
  const redirectUri = `${window.location.origin}/auth/callback`;
  const scope = 'read,activity:read_all';
  
  console.log('🔗 Generated OAuth URL with redirect URI:', redirectUri);
  
  return `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
}

export async function exchangeCodeForTokens(code: string): Promise<StravaTokens> {
  const response = await fetch('/api/auth/strava/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  return response.json();
}
