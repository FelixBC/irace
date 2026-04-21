import { StravaTokens, StravaActivity, StravaAthlete } from '../types';
import { API_BASE_URL } from '../config/api';
import { assertOk, authFetch, getAccessToken, parseJsonResponse } from './apiClient';
import { stravaRefreshEnvelopeSchema } from '../schemas/apiResponses';
import {
  mapStravaActivityTypeToSport,
  STRAVA_ACTIVITY_TYPES_CLIENT_PRIMARY,
} from '../../shared/stravaSportType.js';

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
    const inBrowser = typeof globalThis !== 'undefined' && 'localStorage' in globalThis;

    if (inBrowser) {
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
      return;
    }

    const cid = process.env.STRAVA_CLIENT_ID;
    const sec = process.env.STRAVA_CLIENT_SECRET;
    if (!cid || !sec) {
      throw new Error('STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET required for server-side refresh');
    }
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cid,
        client_secret: sec,
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

  private async makeAuthenticatedRequest<T>(endpoint: string): Promise<T> {
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

  async getActivitiesByDateRange(startDate: Date, endDate: Date): Promise<StravaActivity[]> {
    const afterTimestamp = Math.floor(startDate.getTime() / 1000);
    const beforeTimestamp = Math.floor(endDate.getTime() / 1000);
    return this.makeAuthenticatedRequest<StravaActivity[]>(
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

  /** Refresh Strava OAuth tokens and return the blob suitable for DB persistence. */
  async refreshTokens(): Promise<StravaTokens> {
    await this.refreshAccessToken();
    return this.getUpdatedTokens();
  }
}

export function mapStravaActivityToActivity(stravaActivity: StravaActivity) {
  const sport = mapStravaActivityTypeToSport(stravaActivity.type);
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
  return STRAVA_ACTIVITY_TYPES_CLIENT_PRIMARY.includes(activity.type) && !activity.manual;
} 