import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const prisma = new PrismaClient();

    try {
      // Connect to database
      await prisma.$connect();
      console.log('✅ Database connected successfully');

      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No valid authorization header' });
      }

      const sessionToken = authHeader.substring(7);
      console.log('🔑 Validating session token:', sessionToken);

      // Find session and include user data
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: {
          user: true
        }
      });

      if (!session) {
        return res.status(401).json({ error: 'Invalid session token' });
      }

      // Check if session is expired
      if (session.expires < new Date()) {
        // Delete expired session
        await prisma.session.delete({
          where: { sessionToken }
        });
        return res.status(401).json({ error: 'Session expired' });
      }

      // Return user data
      res.status(200).json({
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          stravaId: session.user.stravaId,
          stravaTokens: session.user.stravaTokens
        },
        stravaTokens: session.user.stravaTokens
      });

      await prisma.$disconnect();
    } catch (error) {
      console.error('Error validating session:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack
      });
      
      await prisma.$disconnect();
      
      // Check if it's a database connection issue
      if (error.message && error.message.includes('connect')) {
        return res.status(500).json({ 
          error: 'Session validation failed',
          details: 'Database connection issue. Please try again.',
          fallback: true
        });
      }
      
      res.status(500).json({ 
        error: 'Session validation failed',
        details: error.message || 'Unknown error occurred',
        fallback: true
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
