import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createLogger } from '../../../server/logger.js';
import { getQueryString } from '../../../server/vercelQuery.js';

const log = createLogger('challengeById');

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method === 'GET') {
      const id = getQueryString(req, 'id');
      log.debug('GET', id);

      let challenge: Record<string, unknown> | null = null;

      if (id === 'demo-challenge') {
        challenge = {
          id: 'demo-challenge',
          name: 'Demo Challenge',
          description: 'A demo fitness challenge with running and cycling',
          sports: ['RUNNING', 'CYCLING'],
          challengeType: 'DISTANCE',
          goal: 50,
          goalUnit: 'km',
          sportGoals: { RUNNING: 30, CYCLING: 20 },
          duration: '30 days',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isPublic: true,
          inviteCode: 'DEMO123',
          maxParticipants: 10,
          status: 'ACTIVE',
          creatorId: 'demo-user',
          createdAt: new Date().toISOString(),
          participants: [
            {
              id: 'user_1',
              name: 'Felix Jose',
              image:
                'https://lh3.googleusercontent.com/a/ACg8ocJhdQhIn4JuOOaAD-FxXG-mV6dzX26BjE3b7HufzZWVq6C14R-zSA=s96-c',
              progress: { RUNNING: 15, CYCLING: 10 },
              totalProgress: 25,
            },
            {
              id: 'user_2',
              name: 'Demo User 2',
              image: 'https://via.placeholder.com/32x32',
              progress: { RUNNING: 20, CYCLING: 15 },
              totalProgress: 35,
            },
          ],
        };
      } else if (id?.startsWith('challenge_')) {
        challenge = {
          id,
          name: 'New Challenge',
          description: 'A newly created fitness challenge',
          sports: ['RUNNING'],
          challengeType: 'DISTANCE',
          goal: 10,
          goalUnit: 'km',
          sportGoals: { RUNNING: 10 },
          duration: '7 days',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isPublic: true,
          inviteCode: 'NEW' + Math.random().toString(36).substring(2, 6).toUpperCase(),
          maxParticipants: 10,
          status: 'ACTIVE',
          creatorId: id.split('_')[1] ? 'user_' + id.split('_')[1] : 'user_real',
          createdAt: new Date().toISOString(),
          participants: [],
        };
      }

      if (challenge) {
        res.status(200).json(challenge);
      } else {
        log.warn('not found', id);
        res.status(404).json({ error: 'Challenge not found' });
      }
    } else {
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    log.error('handler error', error);

    res.status(500).json({
      error: 'Challenge API error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
