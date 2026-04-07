import { PrismaClient, Prisma } from '@prisma/client';
import { createLogger } from './server/logger.js';

const prisma = new PrismaClient();
const log = createLogger('setup-db');

async function setupDatabase() {
  log.info('setting up database (dev seed)');

  try {
    await prisma.$connect();
    log.info('connected');

    let creatorId = (await prisma.user.findFirst())?.id;
    if (!creatorId) {
      log.debug('creating test user');
      const testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://via.placeholder.com/150',
          stravaId: null,
          stravaTokens: Prisma.DbNull,
        },
      });
      creatorId = testUser.id;
      log.info('test user created', creatorId);
    } else {
      log.debug('test user already exists');
    }

    const existingChallenge = await prisma.challenge.findFirst();
    if (!existingChallenge) {
      log.debug('creating test challenge');
      const testChallenge = await prisma.challenge.create({
        data: {
          name: 'Test Challenge',
          description: 'A test fitness challenge',
          sports: ['RUNNING', 'CYCLING'],
          challengeType: 'DISTANCE',
          goal: 100,
          goalUnit: 'km',
          sportGoals: {
            RUNNING: 50,
            CYCLING: 50,
            SWIMMING: 0,
            WALKING: 0,
            HIKING: 0,
            YOGA: 0,
            WEIGHT_TRAINING: 0,
          },
          duration: '1_MONTH',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isPublic: true,
          inviteCode: 'TEST123',
          maxParticipants: 10,
          status: 'ACTIVE',
          creatorId,
        },
      });
      log.info('test challenge created', testChallenge.id);
    } else {
      log.debug('test challenge already exists');
    }

    log.info('setup complete');
  } catch (error) {
    log.error('setup failed', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void setupDatabase();
