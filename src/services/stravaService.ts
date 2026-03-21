import { StravaTokens, StravaActivity, StravaAthlete } from '../types';
import { getApiBaseUrl, getStravaCallbackUrl } from '../config/urls';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

function getClientId(): string {
  return import.meta.env.VITE_STRAVA_CLIENT_ID || '';
}

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
    const sessionToken = typeof localStorage !== 'undefined' ? localStorage.getItem('session_token') : null;
    if (!sessionToken) {
      throw new Error('No session — sign in again');
    }

    const response = await fetch(`${getApiBaseUrl()}/strava/refresh-token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Strava access token');
    }

    const data = await response.json();
    const t = data.stravaTokens;
    this.accessToken = t.access_token;
    this.refreshToken = t.refresh_token;
    this.expiresAt = t.expires_at;
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

export function getStravaAuthUrl(returnPath?: string): string {
  const clientId = getClientId();
  if (!clientId) {
    console.error('VITE_STRAVA_CLIENT_ID is not set');
  }
  const redirectUri = getStravaCallbackUrl();
  const scope = 'read,activity:read_all';

  let url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  if (returnPath) {
    url += `&state=${encodeURIComponent(returnPath)}`;
  }
  return url;
}
