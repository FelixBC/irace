import { PrismaClient } from '@prisma/client';
const { getFrontendUrl } = require('../config/urls.js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Create a new PrismaClient instance for each request with aggressive connection management
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Force new connections and disable connection pooling
    __internal: {
      engine: {
        enableEngineDebugMode: false,
        enableQueryLogging: false
      }
    }
  });

  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    console.log('🔑 Authorization code received:', code);

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to exchange code for tokens: ${tokenResponse.statusText}`);
    }

    const tokens = await tokenResponse.json();
    console.log('✅ Tokens received successfully');

    // Get athlete info
    const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!athleteResponse.ok) {
      throw new Error(`Failed to get athlete info: ${athleteResponse.statusText}`);
    }

    const athlete = await athleteResponse.json();
    console.log('✅ Athlete info received:', athlete.firstname, athlete.lastname);

    try {
      // Create or update user using stravaId for consistent identification
      const userId = `user_${athlete.id}`;
      
      console.log('🔧 Creating/updating user with ID:', userId);
      console.log('📝 User data:', {
        name: `${athlete.firstname} ${athlete.lastname}`,
        stravaId: athlete.id.toString(),
        hasTokens: !!tokens.access_token
      });
      
      // First, ensure the User table exists with proper constraints
      console.log('🔧 Ensuring User table exists...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "User" (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT UNIQUE,
          "emailVerified" TIMESTAMP,
          image TEXT,
          "stravaId" TEXT UNIQUE,
          "stravaTokens" JSONB,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;
      
      // Drop and recreate the unique constraint to ensure it exists
      console.log('🔧 Ensuring unique constraint exists...');
      try {
        await prisma.$executeRaw`ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_stravaId_key"`;
        await prisma.$executeRaw`ALTER TABLE "User" ADD CONSTRAINT "User_stravaId_key" UNIQUE ("stravaId")`;
      } catch (constraintError) {
        console.log('⚠️ Constraint already exists or error:', constraintError.message);
      }
      
      // Use simple SQL raw to avoid Prisma ORM issues
      console.log('🔧 Creating/updating user with SQL raw...');
      const userResult = await prisma.$executeRaw`
        INSERT INTO "User" (id, name, email, image, "stravaId", "stravaTokens", "createdAt", "updatedAt")
        VALUES (${userId}, ${`${athlete.firstname} ${athlete.lastname}`}, ${`strava_${athlete.id}@example.com`}, ${athlete.profile}, ${athlete.id.toString()}, ${JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
          expires_in: tokens.expires_in
        })}::jsonb, ${new Date()}, ${new Date()})
        ON CONFLICT ("stravaId") 
        DO UPDATE SET
          name = EXCLUDED.name,
          image = EXCLUDED.image,
          "stravaTokens" = EXCLUDED."stravaTokens",
          "updatedAt" = EXCLUDED."updatedAt"
        RETURNING id, name, "stravaId"
      `;
      
      console.log('✅ User created/updated successfully with SQL raw');
      
      // Create a mock user object for compatibility
      const user = {
        id: userId,
        name: `${athlete.firstname} ${athlete.lastname}`,
        stravaId: athlete.id.toString()
      };

      console.log('✅ User created/updated successfully:', user.id);
      console.log('📋 User details:', {
        id: user.id,
        name: user.name,
        stravaId: user.stravaId,
        hasTokens: !!user.stravaTokens
      });

      // Create a session for the user
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      console.log('🔧 Creating session with token:', sessionToken);
      console.log('📝 Session data:', {
        id: sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      const session = await prisma.session.create({
        data: {
          id: sessionToken, // Use sessionToken as the ID
          sessionToken: sessionToken,
          userId: user.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      console.log('✅ Session created successfully:', session.id);
      console.log('📋 Session details:', {
        id: session.id,
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires
      });

      await prisma.$disconnect();
      console.log('✅ Prisma disconnected successfully');

      // Redirect to frontend with session token
      const redirectUrl = `${getFrontendUrl()}?session=${sessionToken}`;
      
      console.log('✅ Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);

    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      console.error('❌ Error details:', {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta
      });
      await prisma.$disconnect();
      res.status(500).json({ 
        error: 'Failed to create user/session',
        details: dbError.message 
      });
    }

  } catch (error) {
    console.error('❌ Error in OAuth callback:', error);
    await prisma.$disconnect();
    res.status(500).json({ 
      error: 'OAuth callback failed',
      details: error.message 
    });
  }
}
