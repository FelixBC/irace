import { prisma } from '../lib/db';
import { User, StravaTokens } from '../types';

export interface CreateUserData {
  name: string;
  email?: string;
  image?: string;
  stravaId: string;
  stravaTokens: StravaTokens;
}

export class UserService {
  static async createOrUpdateUser(data: CreateUserData): Promise<User> {
    try {
      const user = await prisma.user.upsert({
        where: { stravaId: data.stravaId },
        update: {
          name: data.name,
          email: data.email,
          image: data.image,
          stravaTokens: data.stravaTokens,
          updatedAt: new Date()
        },
        create: {
          name: data.name,
          email: data.email,
          image: data.image,
          stravaId: data.stravaId,
          stravaTokens: data.stravaTokens
        }
      });

      return {
        id: user.id,
        name: user.name || 'Unknown User',
        email: user.email,
        image: user.image,
        stravaId: user.stravaId || '',
        stravaTokens: user.stravaTokens as StravaTokens
      };
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw new Error('Failed to save user data. Please try again.');
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return null;

      return {
        id: user.id,
        name: user.name || 'Unknown User',
        email: user.email,
        image: user.image,
        stravaId: user.stravaId || '',
        stravaTokens: user.stravaTokens as StravaTokens
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to load user data. Please try again.');
    }
  }

  static async getUserByStravaId(stravaId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { stravaId }
      });

      if (!user) return null;

      return {
        id: user.id,
        name: user.name || 'Unknown User',
        email: user.email,
        image: user.image,
        stravaId: user.stravaId || '',
        stravaTokens: user.stravaTokens as StravaTokens
      };
    } catch (error) {
      console.error('Error fetching user by Strava ID:', error);
      throw new Error('Failed to load user data. Please try again.');
    }
  }

  static async updateUserTokens(userId: string, tokens: StravaTokens): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          stravaTokens: tokens,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating user tokens:', error);
      throw new Error('Failed to update user tokens. Please try again.');
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: userId }
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user. Please try again.');
    }
  }

  static async getUserStats(userId: string): Promise<{
    totalChallenges: number;
    completedChallenges: number;
    activeChallenges: number;
    totalActivities: number;
  }> {
    try {
      const [challenges, activities] = await Promise.all([
        prisma.challenge.count({
          where: {
            OR: [
              { creatorId: userId },
              {
                participants: {
                  some: {
                    userId: userId
                  }
                }
              }
            ]
          }
        }),
        prisma.activity.count({
          where: { userId }
        })
      ]);

      // For now, return basic stats. In the future, we can add more complex calculations
      return {
        totalChallenges: challenges,
        completedChallenges: 0, // TODO: Calculate based on challenge status and user progress
        activeChallenges: 0, // TODO: Calculate based on challenge status and user participation
        totalActivities: activities
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw new Error('Failed to load user statistics. Please try again.');
    }
  }
}
