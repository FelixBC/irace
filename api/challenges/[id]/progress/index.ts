import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'PUT') {
    try {
      const { userId, progress } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Update participation progress
      const updatedParticipation = await prisma.participation.updateMany({
        where: {
          userId,
          challengeId: id as string
        },
        data: {
          progress,
          lastActivityAt: new Date()
        }
      });

      if (updatedParticipation.count === 0) {
        return res.status(404).json({ error: 'Participation not found' });
      }

      res.status(200).json({ message: 'Progress updated successfully' });
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
