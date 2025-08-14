export default function handler(req, res) {
  console.log('🏆 === CHALLENGES MAIN API FUNCTION START ===');
  
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method === 'POST') {
      console.log('🏆 Processing POST request to create challenge...');
      
      const challengeData = req.body;
      console.log('🏆 Received challenge data:', challengeData);

      // For now, return a mock challenge since we're not using the database yet
      // In the future, this would save to the database
      const mockChallenge = {
        id: 'challenge_' + Date.now(),
        name: challengeData.name,
        description: challengeData.description,
        sports: challengeData.sports,
        challengeType: challengeData.challengeType,
        goal: challengeData.goal,
        goalUnit: challengeData.goalUnit,
        sportGoals: challengeData.sportGoals,
        duration: challengeData.duration,
        startDate: challengeData.startDate,
        endDate: challengeData.endDate,
        isPublic: challengeData.isPublic,
        inviteCode: challengeData.inviteCode,
        maxParticipants: challengeData.maxParticipants,
        status: challengeData.status,
        creatorId: challengeData.creatorId,
        createdAt: new Date().toISOString(),
        participants: []
      };

      console.log('✅ Challenge created successfully');
      res.status(201).json(mockChallenge);
      
    } else if (req.method === 'GET') {
      console.log('🏆 Processing GET request to fetch challenges...');
      
      const { id } = req.query;
      
      if (id) {
        // Get specific challenge by ID
        console.log('🏆 Requested challenge ID:', id);
        
        let challenge = null;

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
                image: 'https://lh3.googleusercontent.com/a/ACg8ocJhdQhIn4JuOOaAD-FxXG-mV6dzX26BjE3b7HufzZWVq6C14R-zSA=s96-c',
                progress: { RUNNING: 15, CYCLING: 10 },
                totalProgress: 25
              },
              {
                id: 'user_2',
                name: 'Demo User 2',
                image: 'https://via.placeholder.com/32x32',
                progress: { RUNNING: 20, CYCLING: 15 },
                totalProgress: 35
              }
            ]
          };
        } else if (id.startsWith('challenge_')) {
          // For newly created challenges, return a basic structure
          challenge = {
            id: id,
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
            participants: []
          };
        }

        if (challenge) {
          console.log('✅ Challenge found and returned successfully');
          res.status(200).json(challenge);
        } else {
          console.log('❌ Challenge not found');
          res.status(404).json({ error: 'Challenge not found' });
        }
      } else {
        // Get all challenges
        const mockChallenges = [
          {
            id: 'demo-challenge',
            name: 'Demo Challenge',
            description: 'A demo fitness challenge',
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
            participants: []
          }
        ];

        console.log('✅ All challenges fetched successfully');
        res.status(200).json(mockChallenges);
      }
      
    } else {
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    
    console.log('✅ === CHALLENGES MAIN API FUNCTION SUCCESS ===');
  } catch (error) {
    console.error('❌ === CHALLENGES MAIN API FUNCTION ERROR ===');
    console.error('❌ Error:', error);
    
    res.status(500).json({ 
      error: 'Challenges API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
