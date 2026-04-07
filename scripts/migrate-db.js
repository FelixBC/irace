import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { createLogger } from '../server/logger.js';

dotenv.config();

const log = createLogger('migrate-db');

async function migrateDatabase() {
  log.info('starting migration');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    log.info('database connected');

    log.debug('pushing schema');
    
    // Create Challenge table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Challenge" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "sports" TEXT[] NOT NULL,
        "challengeType" TEXT NOT NULL DEFAULT 'DISTANCE',
        "goal" DOUBLE PRECISION NOT NULL,
        "goalUnit" TEXT NOT NULL,
        "duration" TEXT NOT NULL,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3) NOT NULL,
        "isPublic" BOOLEAN NOT NULL DEFAULT true,
        "inviteCode" TEXT NOT NULL UNIQUE,
        "maxParticipants" INTEGER NOT NULL DEFAULT 10,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "creatorId" TEXT NOT NULL,
        "sportGoals" JSONB
      );
    `;
    
    log.info('Challenge table created/verified');
    
    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Challenge_creatorId_idx" ON "Challenge"("creatorId");
      CREATE INDEX IF NOT EXISTS "Challenge_startDate_endDate_idx" ON "Challenge"("startDate", "endDate");
      CREATE INDEX IF NOT EXISTS "Challenge_inviteCode_idx" ON "Challenge"("inviteCode");
      CREATE INDEX IF NOT EXISTS "Challenge_status_idx" ON "Challenge"("status");
      CREATE INDEX IF NOT EXISTS "Challenge_isPublic_idx" ON "Challenge"("isPublic");
    `;
    
    log.info('indexes created/verified');
    
    // Test if we can query the table
    const testResult = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Challenge' 
      ORDER BY ordinal_position;
    `;
    
    log.debug('Challenge columns', testResult);
  } catch (error) {
    log.error('migration failed', error);
  } finally {
    await prisma.$disconnect();
    log.info('migration finished');
  }
}

migrateDatabase();
