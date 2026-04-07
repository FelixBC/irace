import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Sport } from '@prisma/client';
import { normalizeSports } from '../../server/normalizeSports.js';
import { createLogger } from '../../server/logger.js';
import { createFreshPrismaClient } from '../../server/prisma.js';
import { applyOptionalInsecureTlsFromEnv } from '../../server/optionalInsecureTls.js';
import { getQueryString } from '../../server/vercelQuery.js';

const log = createLogger('challenges');

const SPORT_ENUM = new Set<string>([
  'RUNNING',
  'CYCLING',
  'SWIMMING',
  'WALKING',
  'HIKING',
  'YOGA',
  'WEIGHT_TRAINING',
]);

function prismaSportsFromInput(raw: unknown): Sport[] {
  const base =
    Array.isArray(raw) && raw.length > 0 ? (raw as unknown[]) : (['RUNNING'] as unknown[]);
  const normalized = normalizeSports(base);
  const out = normalized
    .map((s) => String(s).toUpperCase())
    .filter((s) => SPORT_ENUM.has(s)) as Sport[];
  return out.length ? out : ['RUNNING'];
}

type JoinBody = {
  challengeId?: string;
  userId?: string;
  challengeDataConsentAccepted?: boolean;
  challengeDataConsentVersion?: string;
};

type CreateChallengeBody = {
  name?: string;
  description?: string;
  sports?: unknown;
  challengeType?: string;
  goal?: number;
  goalUnit?: string;
  sportGoals?: Record<string, number>;
  duration?: string;
  startDate?: string;
  endDate?: string;
  isPublic?: boolean;
  inviteCode?: string;
  maxParticipants?: number;
  status?: string;
  creatorId?: string;
  creatorParticipantSharingAck?: boolean;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyOptionalInsecureTlsFromEnv();
  log.debug(req.method, req.url || '');

  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method === 'POST' && getQueryString(req, 'action') === 'join') {
      const body = (req.body ?? {}) as JoinBody;
      const { challengeId, userId, challengeDataConsentAccepted, challengeDataConsentVersion } = body;

      if (!challengeId || !userId) {
        log.warn('join rejected: missing challengeId or userId');
        return res.status(400).json({ error: 'Challenge ID and User ID are required' });
      }

      if (!challengeDataConsentAccepted || challengeDataConsentVersion !== '1') {
        return res.status(400).json({
          error:
            'You must agree that aggregated challenge stats may be shown to other participants in this challenge.',
        });
      }

      log.debug('join', { challengeId, userId });

      const prisma = createFreshPrismaClient();

      try {
        const challenge = await prisma.challenge.findUnique({
          where: { id: challengeId },
          select: { id: true, maxParticipants: true, status: true },
        });

        if (!challenge) {
          return res.status(404).json({ error: 'Challenge not found' });
        }

        if (challenge.status !== 'ACTIVE') {
          return res.status(400).json({ error: 'Challenge is not active' });
        }

        const activeCount = await prisma.participation.count({
          where: { challengeId, status: 'ACTIVE' },
        });

        if (activeCount >= challenge.maxParticipants) {
          return res.status(400).json({ error: 'Challenge is full' });
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        const existing = await prisma.participation.findUnique({
          where: { userId_challengeId: { userId, challengeId } },
        });

        if (existing) {
          return res.status(400).json({ error: 'User is already participating in this challenge' });
        }

        const participationId = `participation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        await prisma.participation.create({
          data: {
            id: participationId,
            userId,
            challengeId,
            status: 'ACTIVE',
            progress: {},
            currentDistance: 0,
            challengeDataConsentAt: new Date(),
            challengeDataConsentVersion: challengeDataConsentVersion || '1',
          },
        });

        log.info('user joined challenge', { challengeId, userId });

        res.status(201).json({
          success: true,
          message: 'Successfully joined challenge',
          participationId,
        });
      } catch (dbError) {
        log.error('join database error', dbError);
        const message = dbError instanceof Error ? dbError.message : 'Unknown error';
        return res.status(500).json({
          error: 'Failed to join challenge',
          details: message,
        });
      } finally {
        await prisma.$disconnect().catch((e) => {
          log.warn('prisma disconnect failed', e?.message ?? e);
        });
      }

      return;
    }

    if (req.method === 'POST') {
      const challengeData = (req.body ?? {}) as CreateChallengeBody;
      log.debug('create challenge', { name: challengeData?.name, creatorId: challengeData?.creatorId });

      if (!challengeData.creatorParticipantSharingAck) {
        return res.status(400).json({
          error:
            "You must acknowledge that participants in this challenge will see each other's challenge progress (aggregated stats for this challenge only).",
        });
      }

      if (!challengeData.startDate || !challengeData.endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const prisma = createFreshPrismaClient();

      try {
        log.debug('db connected (create)');

        const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const inviteCode =
          challengeData.inviteCode || Math.random().toString(36).substring(2, 8).toUpperCase();
        const sports = prismaSportsFromInput(challengeData.sports);

        await prisma.challenge.create({
          data: {
            id: challengeId,
            name: challengeData.name || 'Test Challenge',
            description: challengeData.description || 'A test challenge',
            sports,
            challengeType: (challengeData.challengeType || 'DISTANCE') as 'DISTANCE' | 'TIME' | 'FREQUENCY',
            goal: challengeData.goal ?? 50,
            goalUnit: challengeData.goalUnit || 'km',
            sportGoals: challengeData.sportGoals ?? {},
            duration: challengeData.duration || '30 days',
            startDate: new Date(challengeData.startDate),
            endDate: new Date(challengeData.endDate),
            isPublic: challengeData.isPublic !== undefined ? challengeData.isPublic : true,
            inviteCode,
            maxParticipants: challengeData.maxParticipants ?? 10,
            status: (challengeData.status || 'ACTIVE') as 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DRAFT',
            creatorId: challengeData.creatorId || 'user_test',
            creatorParticipantSharingAckAt: new Date(),
          },
        });

        log.info('challenge created', { challengeId, inviteCode });
        res.status(201).json({
          success: true,
          message: 'Challenge created successfully',
          challengeId,
          data: challengeData,
        });
      } catch (dbError) {
        log.error('create challenge database error', dbError);
        const message = dbError instanceof Error ? dbError.message : 'Unknown error';
        res.status(500).json({
          error: 'Failed to create challenge in database',
          details: message,
        });
      } finally {
        await prisma.$disconnect().catch((e) => {
          log.warn('prisma disconnect failed', e?.message ?? e);
        });
      }

      return;
    }

    if (req.method === 'GET') {
      const id = getQueryString(req, 'id');

      if (id) {
        log.debug('get challenge by inviteCode', id);

        if (id === 'demo-challenge') {
          const demoChallenge = {
            id: 'demo-challenge',
            name: 'Demo Challenge',
            description: 'A demo fitness challenge with running and cycling',
            sports: ['RUNNING', 'CYCLING'],
            challengeType: 'DISTANCE',
            goal: 50,
            goalUnit: 'km',
            sportGoals: { RUNNING: 30, CYCLING: 20 },
            duration: '30 days',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            isPublic: true,
            inviteCode: 'DEMO123',
            maxParticipants: 10,
            status: 'ACTIVE',
            creatorId: 'demo-user',
            createdAt: new Date().toISOString(),
            participants: [
              {
                user: {
                  id: 'user_1',
                  name: 'Felix Jose',
                  image:
                    'https://lh3.googleusercontent.com/a/ACg8ocJhdQhIn4JuOOaAD-FxXG-mV6dzX26BjE3b7HufzZWVq6C14R-zSA=s96-c',
                  stravaId: null,
                },
                distance: 25,
                percentage: 0,
                dailyProgress: [],
                joinedAt: new Date().toISOString(),
                progress: { RUNNING: 15, CYCLING: 10 },
                lastActivityDate: null,
                finishedAt: null,
                finishPosition: null,
                finalDistance: null,
              },
              {
                user: {
                  id: 'user_2',
                  name: 'Demo Runner 2',
                  image: 'https://via.placeholder.com/32x32',
                  stravaId: null,
                },
                distance: 35,
                percentage: 0,
                dailyProgress: [],
                joinedAt: new Date().toISOString(),
                progress: { RUNNING: 20, CYCLING: 15 },
                lastActivityDate: null,
                finishedAt: null,
                finishPosition: null,
                finalDistance: null,
              },
            ],
          };
          log.debug('demo challenge returned');
          res.status(200).json(demoChallenge);
          return;
        }

        const prisma = createFreshPrismaClient();

        try {
          log.debug('db connected (get by invite)');

          let challenge = await prisma.challenge.findFirst({
            where: { inviteCode: id },
            include: {
              participants: {
                where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
                include: {
                  user: { select: { id: true, name: true, image: true, stravaId: true } },
                },
              },
            },
          });

          if (!challenge) {
            log.warn('challenge not found for inviteCode', id);
            return res.status(404).json({ error: 'Challenge not found' });
          }

          if (challenge.status === 'ACTIVE') {
            await prisma.challenge.updateMany({
              where: {
                id: challenge.id,
                status: 'ACTIVE',
                endDate: { lte: new Date() },
              },
              data: {
                status: 'COMPLETED',
                completedAt: new Date(),
              },
            });
            challenge = await prisma.challenge.findFirst({
              where: { id: challenge.id },
              include: {
                participants: {
                  where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
                  include: {
                    user: { select: { id: true, name: true, image: true, stravaId: true } },
                  },
                },
              },
            });
          }

          if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
          }

          const { participants: rawParticipants, ...challengeRest } = challenge;

          const sorted = [...rawParticipants].sort((a, b) => {
            const fa = a.finishPosition ?? Number.MAX_SAFE_INTEGER;
            const fb = b.finishPosition ?? Number.MAX_SAFE_INTEGER;
            if (fa !== fb) return fa - fb;
            return a.joinedAt.getTime() - b.joinedAt.getTime();
          });

          const participants = sorted.map((row) => ({
            user: {
              id: row.user.id,
              name: row.user.name,
              image: row.user.image,
              stravaId: row.user.stravaId,
            },
            distance: row.currentDistance || 0,
            percentage: 0,
            dailyProgress: [] as unknown[],
            joinedAt: row.joinedAt,
            progress: row.progress || {},
            lastActivityDate: row.lastActivityDate,
            finishedAt: row.finishedAt,
            finishPosition: row.finishPosition,
            finalDistance: row.finalDistance,
          }));

          log.debug('participants loaded', participants.length);

          const challengeWithParticipants = {
            ...challengeRest,
            sports: normalizeSports(challenge.sports),
            participants,
          };

          res.status(200).json(challengeWithParticipants);
        } catch (dbError) {
          log.error('get challenge database error', dbError);
          const message = dbError instanceof Error ? dbError.message : 'Unknown error';
          res.status(500).json({
            error: 'Failed to fetch challenge from database',
            details: message,
          });
        } finally {
          await prisma.$disconnect().catch((e) => {
            log.warn('prisma disconnect failed', e?.message ?? e);
          });
        }

        return;
      }

      const prisma = createFreshPrismaClient();

      try {
        log.debug('db connected (list challenges)');

        const rows = await prisma.challenge.findMany({
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
        });

        const challenges = rows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          sports: normalizeSports(row.sports),
          challengeType: row.challengeType,
          goal: row.goal,
          goalUnit: row.goalUnit,
          sportGoals: row.sportGoals,
          duration: row.duration,
          startDate: row.startDate,
          endDate: row.endDate,
          isPublic: row.isPublic,
          inviteCode: row.inviteCode,
          maxParticipants: row.maxParticipants,
          status: row.status,
          creatorId: row.creatorId,
          createdAt: row.createdAt,
          participants: [],
        }));

        const demoChallenge = {
          id: 'demo-challenge',
          name: 'Demo Challenge',
          description: 'A demo fitness challenge',
          sports: ['RUNNING', 'CYCLING'],
          challengeType: 'DISTANCE',
          goal: 50,
          goalUnit: 'km',
          sportGoals: { RUNNING: 30, CYCLING: 20 },
          duration: '30 days',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isPublic: true,
          inviteCode: 'DEMO123',
          maxParticipants: 10,
          status: 'ACTIVE',
          creatorId: 'demo-user',
          createdAt: new Date().toISOString(),
          participants: [],
        };

        const allChallenges = [demoChallenge, ...challenges];

        log.debug('list challenges ok', challenges.length);
        res.status(200).json(allChallenges);
      } catch (dbError) {
        log.error('list challenges database error', dbError);
        const message = dbError instanceof Error ? dbError.message : 'Unknown error';
        res.status(500).json({
          error: 'Failed to fetch challenges from database',
          details: message,
        });
      } finally {
        await prisma.$disconnect().catch((e) => {
          log.warn('prisma disconnect failed', e?.message ?? e);
        });
      }

      return;
    }

    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (error) {
    log.error('handler error', error);

    res.status(500).json({
      error: 'Challenges API error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
