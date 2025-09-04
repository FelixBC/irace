export default async function handler(req, res) {
  console.log('🏆 === CHALLENGES API START ===');
  
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
        console.log('✅ Database connected successfully with native pg client');
        
        // Generate unique ID
        const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Create challenge using native pg client
        const sportsArray = challengeData.sports ? challengeData.sports.map(s => `'${s}'`).join(',') : "'RUNNING'";
        const sportGoalsJson = challengeData.sportGoals ? JSON.stringify(challengeData.sportGoals) : '{}';
        const startDate = new Date(challengeData.startDate).toISOString();
        const endDate = new Date(challengeData.endDate).toISOString();
        
        const query = `
          INSERT INTO "Challenge" (
            "id", "name", "description", "sports", "challengeType", 
            "goal", "goalUnit", "sportGoals", "duration", 
            "startDate", "endDate", "isPublic", "inviteCode", 
            "maxParticipants", "status", "creatorId", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, ARRAY[${sportsArray}]::"Sport"[], $4::"ChallengeType",
            $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13, $14::"ChallengeStatus", $15, NOW(), NOW()
          )
        `;
        
        const values = [
          challengeId,
          challengeData.name || 'Test Challenge',
          challengeData.description || 'A test challenge',
          challengeData.challengeType || 'DISTANCE',
          challengeData.goal || 50,
          challengeData.goalUnit || 'km',
          sportGoalsJson,
          challengeData.duration || '30 days',
          startDate,
          endDate,
          challengeData.isPublic !== undefined ? challengeData.isPublic : true,
          challengeData.inviteCode || 'TEST123',
          challengeData.maxParticipants || 10,
          challengeData.status || 'ACTIVE',
          challengeData.creatorId || 'user_test'
        ];
        
        await client.query(query, values);
        await client.end();
        
        console.log('✅ Challenge created successfully in database');
        res.status(201).json({
          success: true,
          message: 'Challenge created successfully',
          challengeId: challengeId,
          data: challengeData
        });
        
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        res.status(500).json({ 
          error: 'Failed to create challenge in database',
          details: dbError.message 
        });
      }
      
    } else if (req.method === 'GET') {
      console.log('🏆 Processing GET request to fetch challenges...');
      
      const { id } = req.query;
      
      if (id) {
        // Get specific challenge by ID
        console.log('🏆 Requested challenge ID:', id);
        
        try {
          // Import Prisma client
          const { createFreshPrismaClient } = await import('../lib/prisma.js');
        const prisma = createFreshPrismaClient();
          
          if (id === 'demo-challenge') {
            // Return demo challenge for landing page
            const demoChallenge = {
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
                  name: 'Demo Runner 2',
                  image: 'https://via.placeholder.com/32x32',
                  progress: { RUNNING: 20, CYCLING: 15 },
                  totalProgress: 35
                }
              ]
            };
            
            console.log('✅ Demo challenge returned successfully');
            res.status(200).json(demoChallenge);
          } else {
            // Get real challenge from database
            const challenge = await prisma.challenge.findUnique({
              where: { id: id },
              include: {
                participants: {
                  include: {
                    user: true
                  }
                },
                creator: true
              }
            });
            
            if (challenge) {
              console.log('✅ Real challenge found and returned successfully');
              res.status(200).json(challenge);
            } else {
              console.log('❌ Challenge not found in database');
              res.status(404).json({ error: 'Challenge not found' });
            }
          }
          
          await prisma.$disconnect();
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
          res.status(500).json({ 
            error: 'Failed to fetch challenge from database',
            details: dbError.message 
          });
        }
      } else {
        // Get all challenges
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
          console.log('✅ Database connected successfully with native pg client for GET');
          
          // Get all public challenges from database
          const result = await client.query(`
            SELECT 
              "id", "name", "description", "sports", "challengeType", 
              "goal", "goalUnit", "sportGoals", "duration", 
              "startDate", "endDate", "isPublic", "inviteCode", 
              "maxParticipants", "status", "creatorId", "createdAt", "updatedAt"
            FROM "Challenge" 
            WHERE "isPublic" = true 
            ORDER BY "createdAt" DESC
          `);
          
          const challenges = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            sports: row.sports,
            challengeType: row.challengeType,
            goal: row.goal,
            goalUnit: row.goalUnit,
            sportGoals: row.sportGoals,
            duration: row.duration,
            startDate: row.startDate,
            endDate: row.endDate,
            isPublic: row.isPublic,
            inviteCode: row.inviteCode,
            maxParticipants: row.maxParticipants,
            status: row.status,
            creatorId: row.creatorId,
            createdAt: row.createdAt,
            participants: [] // Empty for now since Participation table doesn't exist
          }));
          
          // Add demo challenge for landing page
          const demoChallenge = {
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
          };
          
                    const allChallenges = [demoChallenge, ...challenges];

          await client.end();

          console.log('✅ All challenges fetched successfully from database');
          res.status(200).json(allChallenges);
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
          res.status(500).json({ 
            error: 'Failed to fetch challenges from database',
            details: dbError.message 
          });
        }
      }
      
    } else {
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    
    console.log('✅ === CHALLENGES API SUCCESS ===');
  } catch (error) {
    console.error('❌ === CHALLENGES API ERROR ===');
    console.error('❌ Error:', error);
    
    res.status(500).json({ 
      error: 'Challenges API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
