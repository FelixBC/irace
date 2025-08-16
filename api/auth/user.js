export default function handler(req, res) {
  console.log('👤 === USER API FUNCTION START ===');
  
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method === 'GET') {
      console.log('👤 Processing GET request for user...');
      
      const authHeader = req.headers.authorization;
      console.log('👤 Auth header:', authHeader);

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ No valid auth header');
        res.status(401).json({ error: 'No valid authorization header' });
        return;
      }

      const sessionToken = authHeader.replace('Bearer ', '');
      console.log('👤 Session token:', sessionToken);

      try {
        // Import Prisma client
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        // Get user from session
        const session = await prisma.session.findUnique({
          where: { sessionToken: sessionToken },
          include: {
            user: true
          }
        });
        
        if (!session) {
          console.log('❌ Session not found');
          res.status(401).json({ error: 'Invalid session' });
          await prisma.$disconnect();
          return;
        }
        
        const user = session.user;
        
        await prisma.$disconnect();
        
        console.log('✅ User data retrieved successfully');
        res.status(200).json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            stravaId: user.stravaId
          },
          message: 'User data retrieved successfully'
        });
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        res.status(500).json({ 
          error: 'Failed to retrieve user data',
          details: dbError.message 
        });
      }
      
    } else if (req.method === 'POST') {
      console.log('👤 Processing POST request to create/update user...');
      
      const userData = req.body;
      console.log('👤 Received user data:', userData);

      try {
        // Import Prisma client
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        // Create or update user
        const user = await prisma.user.upsert({
          where: { email: userData.email },
          update: {
            name: userData.name,
            image: userData.image,
            stravaId: userData.stravaId,
            stravaTokens: userData.stravaTokens ? JSON.stringify(userData.stravaTokens) : null
          },
          create: {
            name: userData.name,
            email: userData.email,
            image: userData.image,
            stravaId: userData.stravaId,
            stravaTokens: userData.stravaTokens ? JSON.stringify(userData.stravaTokens) : null
          }
        });
        
        await prisma.$disconnect();
        
        console.log('✅ User created/updated successfully');
        res.status(200).json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            stravaId: user.stravaId
          },
          message: 'User created/updated successfully'
        });
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        res.status(500).json({ 
          error: 'Failed to create/update user',
          details: dbError.message 
        });
      }
      
    } else {
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    
    console.log('✅ === USER API FUNCTION SUCCESS ===');
  } catch (error) {
    console.error('❌ === USER API FUNCTION ERROR ===');
    console.error('❌ Error:', error);
    
    res.status(500).json({ 
      error: 'User API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
