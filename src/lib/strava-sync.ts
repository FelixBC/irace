import { prisma } from '@/lib/db';
import { StravaAPI } from '@/lib/strava';
import { isActivityRelevant } from '@/lib/strava';

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
    activities: any[],
    challenge: any,
    participationDate: Date
  ): Promise<number> {
    let totalProgress = 0;

    // Filter activities that are relevant to this challenge
    const relevantActivities = activities.filter(activity => {
      // Only count activities after joining the challenge
      const activityDate = new Date(activity.start_date);
      if (activityDate < participationDate) {
        return false;
      }

      // Only count activities within challenge date range
      if (challenge.startDate && activityDate < new Date(challenge.startDate)) {
        return false;
      }
      if (challenge.endDate && activityDate > new Date(challenge.endDate)) {
        return false;
      }

      // Check if activity is relevant to the challenge sport
      return isActivityRelevant(activity, challenge.sport);
    });

    // Calculate total distance/progress based on challenge type
    for (const activity of relevantActivities) {
      switch (challenge.challengeType) {
        case 'DISTANCE':
          // Convert to kilometers
          const distanceKm = activity.distance / 1000;
          totalProgress += distanceKm;
          break;
        
        case 'TIME':
          // Convert to hours
          const timeHours = activity.moving_time / 3600;
          totalProgress += timeHours;
          break;
        
        case 'FREQUENCY':
          // Count activities
          totalProgress += 1;
          break;
      }
    }

    return Math.min(totalProgress, challenge.goal);
  }

  /**
   * Get real-time progress for a challenge
   */
  static async getChallengeProgress(challengeId: string): Promise<any> {
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
      console.error('Failed to refresh tokens:', error);
      return false;
    }
  }
} 