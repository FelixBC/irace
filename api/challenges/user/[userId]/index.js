import { Pool } from 'pg';
import { normalizeSports } from '../../lib/normalizeSports.js';

// Disable SSL verification for Vercel
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Get challenges where user is either creator or participant
    const query = `
      SELECT DISTINCT c.*, 
             COUNT(p.id) as participant_count,
             CASE WHEN c."creatorId" = $1 THEN true ELSE false END as is_creator
      FROM "Challenge" c
      LEFT JOIN "Participation" p ON c.id = p."challengeId"
      WHERE c."creatorId" = $1 OR p."userId" = $1
      GROUP BY c.id
      ORDER BY c."createdAt" DESC
    `;

    const result = await pool.query(query, [userId]);

    // Transform the data to match frontend expectations
    const challenges = result.rows.map(challenge => ({
      id: challenge.id,
      name: challenge.name,
      description: challenge.description || '',
      sports: normalizeSports(challenge.sports),
      challengeType: challenge.challengeType,
      goal: challenge.goal,
      goalUnit: challenge.goalUnit,
      sportGoals: challenge.sportGoals || {},
      duration: challenge.duration,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      isPublic: challenge.isPublic,
      inviteCode: challenge.inviteCode,
      maxParticipants: challenge.maxParticipants,
      status: challenge.status,
      creatorId: challenge.creatorId,
      participants: parseInt(challenge.participant_count) || 0,
      isCreator: challenge.is_creator,
      createdAt: challenge.createdAt,
      updatedAt: challenge.updatedAt
    }));

    res.status(200).json(challenges);
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user challenges',
      details: error.message 
    });
  }
}
