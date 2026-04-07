import type { VercelRequest, VercelResponse } from '@vercel/node';
import { normalizeSports } from '../../../../server/normalizeSports.js';
import { createLogger } from '../../../../server/logger.js';
import { createFreshPrismaClient } from '../../../../server/prisma.js';
import { applyOptionalInsecureTlsFromEnv } from '../../../../server/optionalInsecureTls.js';
import { getQueryString } from '../../../../server/vercelQuery.js';

const log = createLogger('challenges/user');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyOptionalInsecureTlsFromEnv();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getQueryString(req, 'userId');

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const prisma = createFreshPrismaClient();

  try {
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
      },
    });

    const challenges = rows.map((challenge) => ({
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
      createdAt: challenge.createdAt,
      updatedAt: challenge.updatedAt,
    }));

    res.status(200).json(challenges);
  } catch (error) {
    log.error('fetch user challenges failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to fetch user challenges',
      details: message,
    });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
