import { Challenge, Sport, ChallengeType, ChallengeStatus } from '../types';
import { addDays } from 'date-fns';

export interface CreateChallengeData {
  name: string;
  sports: Sport[];
  duration: number;
  isPrivate: boolean;
}

export class ChallengeService {
  private static STORAGE_KEY = 'race_app_challenges';

  static createChallenge(data: CreateChallengeData, creatorId: string): Challenge {
    const shareCode = this.generateShareCode();
    const startDate = new Date();
    const endDate = addDays(startDate, data.duration);

    const challenge: Challenge = {
      id: `challenge-${Date.now()}`,
      name: data.name,
      description: `${data.name} - A fitness challenge with ${data.sports.length} sports`,
      sports: data.sports,
      challengeType: ChallengeType.DISTANCE,
      goal: 100, // Default goal
      goalUnit: 'km',
      duration: `${data.duration} days`,
      startDate,
      endDate,
      isPublic: !data.isPrivate,
      inviteCode: shareCode,
      maxParticipants: 10,
      status: ChallengeStatus.ACTIVE,
      creatorId,
    };

    // Store the challenge
    this.storeChallenge(challenge);

    return challenge;
  }

  static getChallenge(challengeId: string): Challenge | null {
    const challenges = this.getAllChallenges();
    return challenges.find(c => c.id === challengeId || c.inviteCode === challengeId) || null;
  }

  static getAllChallenges(): Challenge[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading challenges from storage:', error);
      return [];
    }
  }

  private static storeChallenge(challenge: Challenge): void {
    try {
      const challenges = this.getAllChallenges();
      const existingIndex = challenges.findIndex(c => c.id === challenge.id);
      
      if (existingIndex >= 0) {
        challenges[existingIndex] = challenge;
      } else {
        challenges.push(challenge);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(challenges));
    } catch (error) {
      console.error('Error storing challenge:', error);
    }
  }

  private static generateShareCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
