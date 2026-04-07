import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { createLogger } from '../server/logger.js';

dotenv.config();

const prisma = new PrismaClient();
const log = createLogger('clean-db');

async function cleanDatabase() {
  try {
    log.info('cleaning database (dev utility)');

    await prisma.challengeTaunt.deleteMany();
    await prisma.pushSubscription.deleteMany();
    await prisma.participation.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.challenge.deleteMany();
    await prisma.avatar.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    await prisma.verificationToken.deleteMany();

    log.info('database cleaned');
  } catch (error) {
    log.error('clean failed', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase()
  .then(() => {
    log.info('done');
    process.exit(0);
  })
  .catch((error: unknown) => {
    log.error('script failed', error);
    process.exit(1);
  });
