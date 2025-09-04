// Prisma client will be imported dynamically to avoid prepared statement issues

export default async function handler(req, res) {
  console.log('🚀 Strava callback handler started');
  console.log('📋 Request method:', req.method);
  console.log('📋 Request query:', req.query);

  // Simple test endpoint
  if (req.query.test === 'true') {
    console.log('🧪 Test endpoint requested');
    return res.status(200).json({
      success: true,
      message: 'Test endpoint working',
      timestamp: new Date().toISOString()
    });
  }

  // Clean database endpoint
  if (req.query.clean === 'true') {
    console.log('🧹 Database cleanup requested');
    
    try {
      const { createFreshPrismaClient } = await import('../lib/prisma.js');
      const prisma = createFreshPrismaClient();
      await prisma.$connect();
      
      // Clean all data in correct order (based on Supabase tables)
      try {
        await prisma.challengeParticipant.deleteMany();
        console.log('✅ ChallengeParticipants deleted');
      } catch (e) { console.log('⚠️ ChallengeParticipant table not found'); }
      
      try {
        await prisma.activity.deleteMany();
        console.log('✅ Activities deleted');
      } catch (e) { console.log('⚠️ Activity table not found'); }
      
      try {
        await prisma.challenge.deleteMany();
        console.log('✅ Challenges deleted');
      } catch (e) { console.log('⚠️ Challenge table not found'); }
      
      try {
        await prisma.session.deleteMany();
        console.log('✅ Sessions deleted');
      } catch (e) { console.log('⚠️ Session table not found'); }
      
      try {
        await prisma.user.deleteMany();
        console.log('✅ Users deleted');
      } catch (e) { console.log('⚠️ User table not found'); }
      
      await prisma.$disconnect();
      
      return res.status(200).json({
        success: true,
        message: 'Database cleaned successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Database cleanup failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Database cleanup failed',
        details: error.message
      });
    }
  }

  if (req.method !== 'GET') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;
    
    if (!code) {
      console.log('❌ No authorization code provided');
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    console.log('🔑 Authorization code received:', code);

    // Exchange authorization code for tokens
    console.log('🔄 Exchanging code for tokens...');
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.log('❌ Token exchange failed:', tokenResponse.status, errorText);
      return res.status(400).json({ error: 'Token exchange failed' });
    }

    const tokens = await tokenResponse.json();
    console.log('✅ Tokens received successfully');

    // Get athlete info
    console.log('👤 Fetching athlete info...');
    const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!athleteResponse.ok) {
      console.log('❌ Failed to fetch athlete info:', athleteResponse.status);
      return res.status(400).json({ error: 'Failed to fetch athlete info' });
    }

    const athlete = await athleteResponse.json();
    console.log('✅ Athlete info received:', athlete.firstname, athlete.lastname);

    // Use native pg client to avoid Prisma prepared statement issues
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });

    try {
      await client.connect();
      console.log('✅ Database connected successfully with native pg client');

      // Create user using raw SQL
      const userId = `user_${athlete.id}`;
      console.log('🔧 Creating user with ID:', userId);

      // Create or update user using raw SQL
      const userResult = await client.query(`
        INSERT INTO "User" (
          "id", "name", "email", "image", "stravaId", "stravaTokens", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT ("stravaId") 
        DO UPDATE SET
          "name" = EXCLUDED."name",
          "image" = EXCLUDED."image",
          "stravaTokens" = EXCLUDED."stravaTokens",
          "updatedAt" = EXCLUDED."updatedAt"
        RETURNING *
      `, [
        userId,
        `${athlete.firstname} ${athlete.lastname}`,
        `strava_${athlete.id}@example.com`,
        athlete.profile || 'https://via.placeholder.com/150',
        athlete.id.toString(),
        JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
          expires_in: tokens.expires_in
        }),
        new Date(),
        new Date()
      ]);

      const user = userResult.rows[0];
      console.log('✅ User created/updated successfully');

      // Create session using raw SQL
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      console.log('🔧 Creating session with token:', sessionToken);

      const sessionResult = await client.query(`
        INSERT INTO "Session" (
          "id", "sessionToken", "userId", "expires"
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [
        sessionToken,
        sessionToken,
        user.id,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      ]);

      const session = sessionResult.rows[0];
      console.log('✅ Session created successfully');

      await client.end();
      console.log('✅ Database disconnected successfully');

      // Redirect to frontend with session token
      const frontendUrl = 'https://project-felixbcs-projects.vercel.app';
      const redirectUrl = `${frontendUrl}?session=${sessionToken}`;

      console.log('✅ Redirecting to:', redirectUrl);
      res.redirect(302, redirectUrl);

    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      try {
        await client.end();
      } catch (e) {
        console.log('⚠️ Error closing client:', e.message);
      }
      return res.status(500).json({
        error: 'Failed to create user/session',
        details: dbError.message
      });
    }

  } catch (error) {
    console.error('❌ Error in OAuth callback:', error);
    return res.status(500).json({
      error: 'OAuth callback failed',
      details: error.message
    });
  }
}