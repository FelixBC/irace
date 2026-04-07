import { prisma } from '@/lib/db';
import { StravaAPI } from '@/lib/strava';
import { isActivityRelevant } from '@/lib/strava';
import { createLogger } from '@/lib/logger';
import type { Challenge, Participation, User } from '@prisma/client';
import type { StravaActivity } from '@/types';

const log = createLogger('strava-sync');

/** Map Strava activity `type` to our Prisma `Sport` enum name. */
function stravaActivityTypeToSportName(type: string): string {
  const map: Record<string, string> = {
    Run: 'RUNNING',
    Ride: 'CYCLING',
    Swim: 'SWIMMING',
    Walk: 'WALKING',
    Hike: 'HIKING',
    Yoga: 'YOGA',
    WeightTraining: 'WEIGHT_TRAINING',
    VirtualRide: 'CYCLING',
    EBikeRide: 'CYCLING',
  };
  return map[type] || 'RUNNING';
}

export type ChallengeProgressSnapshot = {
  challenge: Challenge & { participants: (Participation & { user: User })[] };
  participants: Array<{
    id: string;
    userId: string;
    user: User;
    progress: number;
    rank: number;
    lastActivityDate: Date | null;
  }>;
};

export interface StravaSyncResult {
  success: boolean;
  activitiesProcessed: number;
  progressUpdated: number;
  errors: string[];
}

export class StravaSyncService {
  /**
   * Sync all active challenges for a user
   */
  static async syncUserChallenges(userId: string): Promise<StravaSyncResult> {
    const result: StravaSyncResult = {
      success: true,
      activitiesProcessed: 0,
      progressUpdated: 0,
      errors: []
    };

    try {
      // Get user with Strava tokens
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          participations: {
            include: {
              challenge: true
            },
            where: {
              challenge: {
                status: 'ACTIVE'
              }
            }
          }
        }
      });

      if (!user || !user.stravaTokens) {
        result.errors.push('User not found or no Strava tokens available');
        return result;
      }

      // Initialize Strava API
      const stravaAPI = new StravaAPI(user.stravaTokens);

      // Get user's recent activities from Strava
      const activities = await stravaAPI.getActivities({
        after: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000), // Last 30 days
        per_page: 200
      });

      if (!activities) {
        result.errors.push('Failed to fetch Strava activities');
        return result;
      }

      result.activitiesProcessed = activities.length;

      // Process each participation
      for (const participation of user.participations) {
        const challenge = participation.challenge;
        
        // Calculate progress for this challenge
        const progress = await this.calculateChallengeProgress(
          activities,
          challenge,
          participation.createdAt
        );

        // Update participation if progress changed
        if (progress !== participation.progress) {
          await prisma.participation.update({
            where: { id: participation.id },
            data: {
              progress,
              lastActivityDate: new Date()
            }
          });
          result.progressUpdated++;
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Sync a specific challenge for all participants
   */
  static async syncChallenge(challengeId: string): Promise<StravaSyncResult> {
    const result: StravaSyncResult = {
      success: true,
      activitiesProcessed: 0,
      progressUpdated: 0,
      errors: []
    };

    try {
      // Get challenge with all participants
      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      });

      if (!challenge) {
        result.errors.push('Challenge not found');
        return result;
      }

      // Sync each participant
      for (const participation of challenge.participants) {
        const user = participation.user;
        
        if (!user.stravaTokens) {
          result.errors.push(`No Strava tokens for user ${user.name}`);
          continue;
        }

        try {
          const userResult = await this.syncUserChallenges(user.id);
          result.activitiesProcessed += userResult.activitiesProcessed;
          result.progressUpdated += userResult.progressUpdated;
          result.errors.push(...userResult.errors);
        } catch (error) {
          result.errors.push(`Failed to sync user ${user.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Challenge sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Calculate progress for a specific challenge based on activities
   */
  private static async calculateChallengeProgress(
    activities: StravaActivity[],
    challenge: Pick<Challenge, 'startDate' | 'endDate' | 'challengeType' | 'goal' | 'sports'>,
    participationDate: Date
  ): Promise<number> {
    let totalProgress = 0;

    const relevantActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.start_date);
      if (activityDate < participationDate) return false;
      if (activityDate < new Date(challenge.startDate)) return false;
      if (activityDate > new Date(challenge.endDate)) return false;
      if (!isActivityRelevant(activity)) return false;

      const sportName = stravaActivityTypeToSportName(activity.type);
      return (challenge.sports as readonly string[]).includes(sportName);
    });

    for (const activity of relevantActivities) {
      switch (challenge.challengeType) {
        case 'DISTANCE': {
          const distanceKm = activity.distance / 1000;
          totalProgress += distanceKm;
          break;
        }
        case 'TIME': {
          const timeHours = activity.moving_time / 3600;
          totalProgress += timeHours;
          break;
        }
        case 'FREQUENCY':
          totalProgress += 1;
          break;
        default:
          break;
      }
    }

    return Math.min(totalProgress, challenge.goal);
  }

  /**
   * Get real-time progress for a challenge
   */
  static async getChallengeProgress(challengeId: string): Promise<ChallengeProgressSnapshot> {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        participants: {
          include: {
            user: true
          },
          orderBy: {
            progress: 'desc'
          }
        }
      }
    });

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    return {
      challenge,
      participants: challenge.participants.map(p => ({
        id: p.id,
        userId: p.userId,
        user: p.user,
        progress: p.progress || 0,
        rank: 0, // Will be calculated
        lastActivityDate: p.lastActivityDate
      }))
    };
  }

  /**
   * Refresh tokens for a user
   */
  static async refreshUserTokens(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user?.stravaTokens) {
        return false;
      }

      const stravaAPI = new StravaAPI(user.stravaTokens);
      const newTokens = await stravaAPI.refreshTokens();

      if (newTokens) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            stravaTokens: newTokens
          }
        });
        return true;
      }

      return false;
    } catch (error) {
      log.error('token refresh failed', error);
      return false;
    }
  }
} 