import { normalizeSports } from '../lib/normalizeSports.js';

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
    // Disable SSL verification for this request
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Use native pg client to avoid Prisma prepared statement issues
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
    
    await client.connect();
    console.log('✅ Database connected successfully for user challenges');

    // Fetch challenges where user is the creator
    const createdChallengesResult = await client.query(`
      SELECT 
        c.*,
        COUNT(p."id") as participants,
        true as "isCreator"
      FROM "Challenge" c
      LEFT JOIN "Participation" p ON c."id" = p."challengeId"
      WHERE c."creatorId" = $1
      GROUP BY c."id"
      ORDER BY c."createdAt" DESC
    `, [userId]);

    // Fetch challenges where user is a participant (but not creator)
    const joinedChallengesResult = await client.query(`
      SELECT 
        c.*,
        COUNT(p."id") as participants,
        false as "isCreator"
      FROM "Challenge" c
      INNER JOIN "Participation" p ON c."id" = p."challengeId"
      WHERE p."userId" = $1 AND c."creatorId" != $1
      GROUP BY c."id", c."name", c."description", c."sports", c."challengeType", c."goal", c."goalUnit", c."sportGoals", c."duration", c."startDate", c."endDate", c."isPublic", c."inviteCode", c."maxParticipants", c."status", c."creatorId", c."createdAt", c."updatedAt"
      ORDER BY MAX(p."joinedAt") DESC
    `, [userId]);

    await client.end();

    // Combine and format the results
    const createdChallenges = createdChallengesResult.rows.map(challenge => ({
      ...challenge,
      sports: normalizeSports(challenge.sports),
      startDate: new Date(challenge.startDate).toISOString(),
      endDate: new Date(challenge.endDate).toISOString(),
      createdAt: new Date(challenge.createdAt).toISOString(),
      updatedAt: new Date(challenge.updatedAt).toISOString(),
      sportGoals: typeof challenge.sportGoals === 'string' 
        ? JSON.parse(challenge.sportGoals) 
        : challenge.sportGoals
    }));

    const joinedChallenges = joinedChallengesResult.rows.map(challenge => ({
      ...challenge,
      sports: normalizeSports(challenge.sports),
      startDate: new Date(challenge.startDate).toISOString(),
      endDate: new Date(challenge.endDate).toISOString(),
      createdAt: new Date(challenge.createdAt).toISOString(),
      updatedAt: new Date(challenge.updatedAt).toISOString(),
      sportGoals: typeof challenge.sportGoals === 'string' 
        ? JSON.parse(challenge.sportGoals) 
        : challenge.sportGoals
    }));

    // Combine both lists
    const allChallenges = [...createdChallenges, ...joinedChallenges];

    res.status(200).json(allChallenges);
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user challenges',
      details: error.message 
    });
  }
}
