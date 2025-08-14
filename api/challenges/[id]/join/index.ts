import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

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
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Check if user is already participating
      const existingParticipation = await prisma.participation.findUnique({
        where: {
          userId_challengeId: {
            userId,
            challengeId: id as string
          }
        }
      });

      if (existingParticipation) {
        return res.status(400).json({ error: 'User is already participating in this challenge' });
      }

      // Create participation
      const participation = await prisma.participation.create({
        data: {
          userId,
          challengeId: id as string,
          status: 'ACTIVE',
          currentDistance: 0,
          joinedAt: new Date()
        }
      });

      res.status(201).json(participation);
    } catch (error) {
      console.error('Error joining challenge:', error);
      res.status(500).json({ error: 'Failed to join challenge' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
