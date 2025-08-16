import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Create a new PrismaClient instance for each request
  const prisma = new PrismaClient();

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' });
    }

    const sessionToken = authHeader.substring(7);
    console.log('🔍 Looking for session:', sessionToken);

    // Find the session in the database
    const session = await prisma.session.findUnique({
      where: { sessionToken: sessionToken },
      include: {
        user: true
      }
    });

    if (!session) {
      console.log('❌ Session not found:', sessionToken);
      return res.status(401).json({ error: 'Session not found' });
    }

    // Check if session has expired
    if (session.expires < new Date()) {
      console.log('❌ Session expired:', sessionToken);
      return res.status(401).json({ error: 'Session expired' });
    }

    console.log('✅ Session found and valid:', session.id);

    // Parse stravaTokens from the user object
    let stravaTokens = null;
    try {
      if (session.user.stravaTokens) {
        stravaTokens = typeof session.user.stravaTokens === 'string' 
          ? JSON.parse(session.user.stravaTokens)
          : session.user.stravaTokens;
      }
    } catch (parseError) {
      console.log('⚠️ Error parsing stravaTokens:', parseError.message);
      stravaTokens = null;
    }

    const response = {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        stravaId: session.user.stravaId
      },
      stravaTokens: stravaTokens,
      message: 'Session validated successfully (JavaScript version)'
    };

    console.log('✅ Session validation completed successfully');
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error in session validation:', error);
    
    // Check if it's a database connection issue
    if (error.message.includes('prepared statement') || error.message.includes('connection')) {
      return res.status(500).json({ 
        error: 'Session validation failed',
        details: 'Database connection issue. Please try again.',
        fallback: true
      });
    }
    
    return res.status(500).json({ 
      error: 'Session validation failed',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
