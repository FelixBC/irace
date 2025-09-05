export default async function handler(req, res) {
  console.log('🔧 === DATABASE SETUP API ===');
  console.log('📋 Request method:', req.method);

  if (req.method !== 'GET' && req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Disable SSL verification for this request
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Use native pg client to avoid Prisma prepared statement issues
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });

    try {
      await client.connect();
      console.log('✅ Database connected successfully with native pg client');

      // Create Participation table
      await client.query(`
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
          CONSTRAINT "Participation_userId_challengeId_key" UNIQUE ("userId", "challengeId")
        )
      `);
      console.log('✅ Participation table created');

      // Create Activity table
      await client.query(`
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
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('✅ Activity table created');

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS "Participation_userId_idx" ON "Participation"("userId")
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS "Participation_challengeId_idx" ON "Participation"("challengeId")
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS "Participation_status_idx" ON "Participation"("status")
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS "Activity_userId_idx" ON "Activity"("userId")
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS "Activity_challengeId_idx" ON "Activity"("challengeId")
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS "Activity_sport_idx" ON "Activity"("sport")
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS "Activity_date_idx" ON "Activity"("date")
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS "Activity_stravaActivityId_idx" ON "Activity"("stravaActivityId")
      `);
      console.log('✅ Indexes created');

      await client.end();
      console.log('🎉 All tables created successfully!');

      res.status(200).json({
        success: true,
        message: 'Database tables created successfully',
        tables: ['Participation', 'Activity']
      });

    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      try {
        await client.end();
      } catch (e) {
        console.log('⚠️ Error closing client:', e.message);
      }
      return res.status(500).json({
        error: 'Failed to create database tables',
        details: dbError.message
      });
    }

  } catch (error) {
    console.error('❌ Error in database setup:', error);
    res.status(500).json({
      error: 'Database setup failed',
      details: error.message
    });
  }
}
