import { Challenge, Sport, ChallengeType, ChallengeStatus } from '../types';
import { CHALLENGES, CHALLENGE, USER_CHALLENGES, JOIN_CHALLENGE, UPDATE_PROGRESS } from '../config/api';
import { getApiBaseUrl } from '../config/urls';
import { addDays } from 'date-fns';

export interface CreateChallengeData {
  name: string;
  sports: Sport[];
  duration: number;
  isPrivate: boolean;
  goals: Record<Sport, number>;
  /** Required for Strava API compliance — creator acknowledges peer visibility in this challenge. */
  creatorParticipantSharingAck: boolean;
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

      if (!response.ok) {
        throw new Error(`Failed to create challenge: ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData.data;
    } catch (error) {
      console.error('Error creating challenge:', error);
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

      const challenge = await response.json();
      return challenge;
    } catch (error) {
      console.error('Error fetching challenge:', error);
      throw new Error('Failed to load challenge. Please try again.');
    }
  }

  static async getAllChallenges(): Promise<Challenge[]> {
    try {
              const response = await fetch(CHALLENGES);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch challenges: ${response.statusText}`);
      }

      const challenges = await response.json();
      return challenges;
    } catch (error) {
      console.error('Error fetching challenges:', error);
      throw new Error('Failed to load challenges. Please try again.');
    }
  }

  static async getUserChallenges(userId: string): Promise<Challenge[]> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/challenges/user-challenges?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user challenges: ${response.statusText}`);
      }

      const challenges = await response.json();
      return challenges;
    } catch (error) {
      console.error('Error fetching user challenges:', error);
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
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to join challenge: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw new Error('Failed to join challenge. Please try again.');
    }
  }

  static async updateChallengeProgress(challengeId: string, userId: string, progress: any): Promise<void> {
    try {
              const response = await fetch(UPDATE_PROGRESS(challengeId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, progress }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update progress: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      throw new Error('Failed to update progress. Please try again.');
    }
  }

  static async syncStravaActivities(userId: string, challengeId?: string): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/strava/sync`, {
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

      return await response.json();
    } catch (error) {
      console.error('Error syncing Strava activities:', error);
      throw new Error('Failed to sync Strava activities. Please try again.');
    }
  }

  private static generateShareCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
