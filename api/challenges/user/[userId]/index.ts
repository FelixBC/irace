import type { VercelRequest, VercelResponse } from '@vercel/node';
import { normalizeSports } from '../../../../server/normalizeSports.js';
import { createLogger } from '../../../../server/logger.js';
import { createFreshPrismaClient } from '../../../../server/prisma.js';
import { applyOptionalInsecureTlsFromEnv } from '../../../../server/optionalInsecureTls.js';
import { getQueryString } from '../../../../server/vercelQuery.js';
import { resolveBearerUserId } from '../../../../server/authSession.js';
import { sendJsonError } from '../../../../server/apiHelpers.js';
import { computeProgressPercent } from '../../../../server/myChallengeProgress.js';
import { applyCors } from '../../../../server/cors.js';

const log = createLogger('challenges/user');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyOptionalInsecureTlsFromEnv();
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return sendJsonError(res, 405, 'Method not allowed');
  }

  const userId = getQueryString(req, 'userId');

  if (!userId) {
    return sendJsonError(res, 400, 'User ID is required');
  }

  const prisma = createFreshPrismaClient();

  try {
    const sessionUserId = await resolveBearerUserId(prisma, req);
    if (!sessionUserId) {
      return sendJsonError(res, 401, 'Unauthorized');
    }
    if (sessionUserId !== userId) {
      return sendJsonError(res, 403, 'Forbidden');
    }

    await prisma.challenge.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lte: new Date() },
        OR: [{ creatorId: userId }, { participants: { some: { userId } } }],
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    const rows = await prisma.challenge.findMany({
      where: {
        OR: [{ creatorId: userId }, { participants: { some: { userId } } }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { participants: true } },
        participants: {
          where: { userId },
          select: { currentDistance: true },
          take: 1,
        },
      },
    });

    const challenges = rows.map((challenge) => {
      const row = challenge.participants[0];
      const currentKm = row ? Number(row.currentDistance) : 0;
      const myProgress = computeProgressPercent(currentKm, challenge.goal);

      return {
        id: challenge.id,
        name: challenge.name,
        description: challenge.description || '',
        sports: normalizeSports(challenge.sports),
        challengeType: challenge.challengeType,
        goal: challenge.goal,
        goalUnit: challenge.goalUnit,
        sportGoals: challenge.sportGoals || {},
        duration: challenge.duration,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        isPublic: challenge.isPublic,
        inviteCode: challenge.inviteCode,
        maxParticipants: challenge.maxParticipants,
        status: challenge.status,
        creatorId: challenge.creatorId,
        participants: challenge._count.participants,
        isCreator: challenge.creatorId === userId,
        myProgress,
        createdAt: challenge.createdAt,
        updatedAt: challenge.updatedAt,
      };
    });

    res.status(200).json(challenges);
  } catch (error) {
    log.error('fetch user challenges failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sendJsonError(res, 500, 'Failed to fetch user challenges', message);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
