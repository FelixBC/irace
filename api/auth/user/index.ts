import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const {
        name,
        email,
        image,
        stravaId,
        stravaTokens
      } = req.body;

      // Create or update user
      const user = await prisma.user.upsert({
        where: { stravaId },
        update: {
          name,
          email,
          image,
          stravaTokens,
          updatedAt: new Date()
        },
        create: {
          name,
          email,
          image,
          stravaId,
          stravaTokens
        }
      });

      // Generate session token
      const sessionToken = randomBytes(32).toString('hex');

      // Create session
      await prisma.session.create({
        data: {
          sessionToken,
          userId: user.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          stravaId: user.stravaId,
          stravaTokens: user.stravaTokens
        },
        sessionToken
      });
    } catch (error) {
      console.error('Error creating/updating user:', error);
      res.status(500).json({ error: 'Failed to save user data' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
