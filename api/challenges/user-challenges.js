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
    // Return mock data based on the database structure you showed me
    const challenges = [
      {
        id: 'challenge_1757107899806_0boie9n',
        name: 'fafa',
        description: 'fafa - A fitness challenge with 1 sports',
        sports: ['RUNNING'],
        challengeType: 'DISTANCE',
        goal: 21,
        goalUnit: 'km',
        sportGoals: { 'RUNNING': 21 },
        duration: '7 days',
        startDate: '2025-09-05T21:31:39.178Z',
        endDate: '2025-09-12T21:31:39.178Z',
        isPublic: true,
        inviteCode: 'OIASB9',
        maxParticipants: 10,
        status: 'ACTIVE',
        creatorId: userId,
        participants: 1,
        isCreator: true,
        createdAt: '2025-09-05T21:31:39.806Z',
        updatedAt: '2025-09-05T21:31:39.806Z'
      }
    ];

    res.status(200).json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ 
      error: 'Failed to fetch challenges',
      details: error.message 
    });
  }
}
