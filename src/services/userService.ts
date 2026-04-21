import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { User, StravaTokens } from '../types';
import { createLogger } from '../lib/logger';

function tokensAsJson(tokens: StravaTokens): Prisma.InputJsonValue {
  return tokens as unknown as Prisma.InputJsonValue;
}

const log = createLogger('userService');

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
          stravaTokens: tokensAsJson(data.stravaTokens),
          updatedAt: new Date()
        },
        create: {
          name: data.name,
          email: data.email,
          image: data.image,
          stravaId: data.stravaId,
          stravaTokens: tokensAsJson(data.stravaTokens)
        }
      });

      return {
        id: user.id,
        name: user.name || 'Unknown User',
        email: user.email ?? undefined,
        image: user.image ?? undefined,
        stravaId: user.stravaId || '',
        stravaTokens: user.stravaTokens as unknown as StravaTokens
      };
    } catch (error) {
      log.error('createOrUpdateUser failed', error);
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
        email: user.email ?? undefined,
        image: user.image ?? undefined,
        stravaId: user.stravaId || '',
        stravaTokens: user.stravaTokens as unknown as StravaTokens
      };
    } catch (error) {
      log.error('getUserById failed', error);
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
        email: user.email ?? undefined,
        image: user.image ?? undefined,
        stravaId: user.stravaId || '',
        stravaTokens: user.stravaTokens as unknown as StravaTokens
      };
    } catch (error) {
      log.error('getUserByStravaId failed', error);
      throw new Error('Failed to load user data. Please try again.');
    }
  }

  static async updateUserTokens(userId: string, tokens: StravaTokens): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          stravaTokens: tokensAsJson(tokens),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      log.error('updateUserTokens failed', error);
      throw new Error('Failed to update user tokens. Please try again.');
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: userId }
      });
    } catch (error) {
      log.error('deleteUser failed', error);
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
      const base = {
        OR: [{ creatorId: userId }, { participants: { some: { userId } } }],
      };

      const [totalChallenges, activeChallenges, completedChallenges, totalActivities] = await Promise.all([
        prisma.challenge.count({ where: base }),
        prisma.challenge.count({ where: { ...base, status: 'ACTIVE' } }),
        prisma.challenge.count({ where: { ...base, status: 'COMPLETED' } }),
        prisma.activity.count({ where: { userId } }),
      ]);

      return {
        totalChallenges,
        completedChallenges,
        activeChallenges,
        totalActivities,
      };
    } catch (error) {
      log.error('getUserStats failed', error);
      throw new Error('Failed to load user statistics. Please try again.');
    }
  }
}
