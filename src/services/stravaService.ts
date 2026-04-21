import { StravaTokens, StravaActivity, StravaAthlete } from '../types';
import { getStravaCallbackUrl } from '../config/urls';
import { createLogger } from '../lib/logger';
import { assertOk, authFetch, getAccessToken, parseJsonResponse } from '../lib/apiClient';
import { stravaRefreshEnvelopeSchema } from '../schemas/apiResponses';
import { API_BASE_URL } from '../config/api';

const log = createLogger('stravaService');

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
    if (!getAccessToken()) {
      throw new Error('No session — sign in again');
    }

    const response = await authFetch(`${API_BASE_URL}/strava/refresh-token`, {
      method: 'POST',
    });

    await assertOk(response, 'Failed to refresh Strava access token');
    const data = await parseJsonResponse(response, stravaRefreshEnvelopeSchema);
    const t = data.stravaTokens;
    this.accessToken = t.access_token;
    this.refreshToken = t.refresh_token;
    this.expiresAt = t.expires_at;
  }

  private async makeAuthenticatedRequest<T>(endpoint: string): Promise<T> {
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

    return (await response.json()) as T;
  }

  async getAthlete(): Promise<StravaAthlete> {
    return this.makeAuthenticatedRequest<StravaAthlete>('/athlete');
  }

  async getActivities(page: number = 1, perPage: number = 30): Promise<StravaActivity[]> {
    return this.makeAuthenticatedRequest<StravaActivity[]>(
      `/athlete/activities?page=${page}&per_page=${perPage}`
    );
  }

  async getActivity(id: number): Promise<StravaActivity> {
    return this.makeAuthenticatedRequest<StravaActivity>(`/activities/${id}`);
  }

  async getActivitiesAfterDate(after: Date): Promise<StravaActivity[]> {
    const afterTimestamp = Math.floor(after.getTime() / 1000);
    return this.makeAuthenticatedRequest<StravaActivity[]>(
      `/athlete/activities?after=${afterTimestamp}`
    );
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
    log.error('VITE_STRAVA_CLIENT_ID is not set');
  }
  const redirectUri = getStravaCallbackUrl();
  const scope = 'read,activity:read_all';

  let url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  if (returnPath) {
    url += `&state=${encodeURIComponent(returnPath)}`;
  }
  return url;
}
