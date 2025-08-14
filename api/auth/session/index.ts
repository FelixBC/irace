import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No valid authorization header' });
      }

      const sessionToken = authHeader.substring(7);

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
    } catch (error) {
      console.error('Error validating session:', error);
      res.status(500).json({ error: 'Failed to validate session' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
