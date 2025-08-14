import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;

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
      const userChallenges = await prisma.challenge.findMany({
        where: {
          OR: [
            { creatorId: userId as string },
            {
              participants: {
                some: {
                  userId: userId as string
                }
              }
            }
          ]
        },
        include: {
          creator: true,
          participants: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.status(200).json(userChallenges);
    } catch (error) {
      console.error('Error fetching user challenges:', error);
      res.status(500).json({ error: 'Failed to fetch user challenges' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
