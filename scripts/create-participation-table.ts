import { createFreshPrismaClient } from '../server/prisma.js';
import { createLogger } from '../server/logger.js';

const log = createLogger('create-participation-table');

async function createParticipationTable() {
  const prisma = createFreshPrismaClient();

  try {
    await prisma.$connect();
    log.info('connected');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Participation" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "challengeId" TEXT NOT NULL,
        "avatarId" TEXT,
        "joinedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "progress" JSONB,
        "lastActivityDate" TIMESTAMP,
        "currentDistance" DOUBLE PRECISION DEFAULT 0,
        "lastActivityAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "Participation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        CONSTRAINT "Participation_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE,
        CONSTRAINT "Participation_userId_challengeId_key" UNIQUE ("userId", "challengeId")
      )
    `);
    log.info('Participation table ensured');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Activity" (
        "id" TEXT PRIMARY KEY,
        "stravaActivityId" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        "challengeId" TEXT,
        "sport" TEXT NOT NULL,
        "distance" DOUBLE PRECISION NOT NULL,
        "duration" INTEGER NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "synced" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        CONSTRAINT "Activity_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id")
      )
    `);
    log.info('Activity table ensured');

    for (const q of [
      `CREATE INDEX IF NOT EXISTS "Participation_userId_idx" ON "Participation"("userId")`,
      `CREATE INDEX IF NOT EXISTS "Participation_challengeId_idx" ON "Participation"("challengeId")`,
      `CREATE INDEX IF NOT EXISTS "Participation_status_idx" ON "Participation"("status")`,
      `CREATE INDEX IF NOT EXISTS "Activity_userId_idx" ON "Activity"("userId")`,
      `CREATE INDEX IF NOT EXISTS "Activity_challengeId_idx" ON "Activity"("challengeId")`,
      `CREATE INDEX IF NOT EXISTS "Activity_sport_idx" ON "Activity"("sport")`,
      `CREATE INDEX IF NOT EXISTS "Activity_date_idx" ON "Activity"("date")`,
      `CREATE INDEX IF NOT EXISTS "Activity_stravaActivityId_idx" ON "Activity"("stravaActivityId")`,
    ]) {
      await prisma.$executeRawUnsafe(q);
    }
    log.info('indexes ensured');
  } catch (error) {
    log.error('migration script error', error);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

void createParticipationTable();
