import { Challenge, Sport, ChallengeType, ChallengeStatus } from '../types';
import { API_BASE_URL, CHALLENGES, USER_CHALLENGES, UPDATE_PROGRESS } from '../config/api';
import { addDays } from 'date-fns';
import { createLogger } from '../lib/logger';
import { assertOk, getAuthHeader, readJson } from '../lib/apiClient';

const log = createLogger('challengeService');

export interface CreateChallengeData {
  name: string;
  sports: Sport[];
  duration: number;
  isPrivate: boolean;
  goals: Record<Sport, number>;
  /** Required for Strava API compliance — creator acknowledges peer visibility in this challenge. */
  creatorParticipantSharingAck: boolean;
}

export type ChallengeProgressPayload = Record<string, unknown>;

/** Response shape from POST /api/strava/sync (server may extend fields). */
export interface StravaSyncApiResponse {
  success?: boolean;
  message?: string;
  syncedCount?: number;
  totalDistance?: number;
  activities?: number;
  error?: string;
  [key: string]: unknown;
}

export interface TauntPresetDto {
  key: string;
  text: string;
}

export interface TauntMessageDto {
  id: string;
  presetKey: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

export interface TauntsListResponse {
  presets: TauntPresetDto[];
  taunts: TauntMessageDto[];
}

export class ChallengeService {
  static async createChallenge(data: CreateChallengeData, creatorId: string): Promise<Challenge> {
    const shareCode = this.generateShareCode();
    const startDate = new Date();
    const endDate = addDays(startDate, data.duration);

    // Calculate average goal for the challenge
    const totalGoal = Object.values(data.goals).reduce((sum, goal) => sum + goal, 0);
    const averageGoal = totalGoal / Object.keys(data.goals).length;

    try {
      const response = await fetch(CHALLENGES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: `${data.name} - A fitness challenge with ${data.sports.length} sports`,
          sports: data.sports,
          challengeType: ChallengeType.DISTANCE,
          goal: averageGoal,
          goalUnit: 'km',
          sportGoals: data.goals,
          duration: `${data.duration} days`,
          startDate,
          endDate,
          isPublic: !data.isPrivate,
          inviteCode: shareCode,
          maxParticipants: 10,
          status: ChallengeStatus.ACTIVE,
          creatorId,
          creatorParticipantSharingAck: data.creatorParticipantSharingAck,
        }),
      });

      await assertOk(response, 'Failed to create challenge');
      const responseData = await readJson<{ data: Challenge }>(response);
      return responseData.data;
    } catch (error) {
      log.error('createChallenge failed', error);
      throw new Error('Failed to create challenge. Please try again.');
    }
  }

  static async getChallenge(challengeId: string): Promise<Challenge | null> {
    try {
      const response = await fetch(`${CHALLENGES}?id=${challengeId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch challenge: ${response.statusText}`);
      }

      const challenge = await readJson<Challenge>(response);
      return challenge;
    } catch (error) {
      log.error('getChallenge failed', error);
      throw new Error('Failed to load challenge. Please try again.');
    }
  }

  static async getAllChallenges(): Promise<Challenge[]> {
    try {
      const response = await fetch(CHALLENGES);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch challenges: ${response.statusText}`);
      }

      const challenges = await readJson<Challenge[]>(response);
      return challenges;
    } catch (error) {
      log.error('getAllChallenges failed', error);
      throw new Error('Failed to load challenges. Please try again.');
    }
  }

  /** Creator-only; requires session cookie / Bearer token. */
  static async deleteChallenge(challengeId: string): Promise<void> {
    const authHeader = getAuthHeader();
    if (!('Authorization' in authHeader)) {
      throw new Error('Please sign in to delete a challenge.');
    }
    const url = `${CHALLENGES}?challengeId=${encodeURIComponent(challengeId)}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...(authHeader as { Authorization: string }),
      },
    });
    await assertOk(response, `Failed to delete challenge (${response.status})`);
  }

  static async getUserChallenges(userId: string): Promise<Challenge[]> {
    try {
      const response = await fetch(USER_CHALLENGES(userId));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user challenges: ${response.statusText}`);
      }

      const challenges = await readJson<Challenge[]>(response);
      return challenges;
    } catch (error) {
      log.error('getUserChallenges failed', error);
      throw new Error('Failed to load your challenges. Please try again.');
    }
  }

  static async joinChallenge(
    challengeId: string,
    userId: string,
    consent: { challengeDataConsentAccepted: boolean; challengeDataConsentVersion: string }
  ): Promise<void> {
    try {
      const response = await fetch(`${CHALLENGES}?action=join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          userId,
          challengeDataConsentAccepted: consent.challengeDataConsentAccepted,
          challengeDataConsentVersion: consent.challengeDataConsentVersion,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || `Failed to join challenge: ${response.statusText}`);
      }
    } catch (error) {
      log.error('joinChallenge failed', error);
      if (error instanceof Error && error.message) {
        throw error;
      }
      throw new Error('Failed to join challenge. Please try again.');
    }
  }

  static async updateChallengeProgress(
    challengeId: string,
    userId: string,
    progress: ChallengeProgressPayload
  ): Promise<void> {
    try {
      const response = await fetch(UPDATE_PROGRESS(challengeId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, progress }),
      });

      await assertOk(response, 'Failed to update progress');
    } catch (error) {
      log.error('updateChallengeProgress failed', error);
      throw new Error('Failed to update progress. Please try again.');
    }
  }

  static async syncStravaActivities(userId: string, challengeId?: string): Promise<StravaSyncApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/strava/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, challengeId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to sync Strava activities: ${response.statusText}`);
      }

      return await readJson<StravaSyncApiResponse>(response);
    } catch (error) {
      log.error('syncStravaActivities failed', error);
      throw new Error('Failed to sync Strava activities. Please try again.');
    }
  }

  static async getTaunts(inviteCode: string, limit = 20): Promise<TauntsListResponse> {
    const url = new URL(`${API_BASE_URL}/challenges/taunts`);
    url.searchParams.set('id', inviteCode);
    url.searchParams.set('limit', String(limit));
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load taunts');
    }
    return await readJson<TauntsListResponse>(res);
  }

  static async sendTaunt(inviteCode: string, presetKey: string): Promise<{ taunt: unknown }> {
    const authHeader = getAuthHeader();
    if (!('Authorization' in authHeader)) throw new Error('Please connect Strava to send taunts.');
    const url = new URL(`${API_BASE_URL}/challenges/taunts`);
    url.searchParams.set('id', inviteCode);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader as { Authorization: string }),
      },
      body: JSON.stringify({ presetKey }),
    });
    await assertOk(res, 'Failed to send taunt');
    return await readJson<{ taunt: unknown }>(res);
  }

  private static generateShareCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
