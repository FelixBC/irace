import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const challenges = await prisma.challenge.findMany({
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

      res.status(200).json(challenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      res.status(500).json({ error: 'Failed to fetch challenges' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        name,
        description,
        sports,
        challengeType,
        goal,
        goalUnit,
        sportGoals,
        duration,
        startDate,
        endDate,
        isPublic,
        inviteCode,
        maxParticipants,
        status,
        creatorId
      } = req.body;

      const challenge = await prisma.challenge.create({
        data: {
          name,
          description,
          sports,
          challengeType,
          goal,
          goalUnit,
          duration,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isPublic,
          inviteCode,
          maxParticipants,
          status,
          creatorId,
        }
      });

      res.status(201).json(challenge);
    } catch (error) {
      console.error('Error creating challenge:', error);
      res.status(500).json({ error: 'Failed to create challenge' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
