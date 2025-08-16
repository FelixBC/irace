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

            try {
        // Import Prisma client
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        // Create challenge in database
        const challenge = await prisma.challenge.create({
          data: {
            name: challengeData.name,
            description: challengeData.description,
            sports: challengeData.sports,
            challengeType: challengeData.challengeType,
            goal: challengeData.goal,
            goalUnit: challengeData.goalUnit,
            sportGoals: challengeData.sportGoals,
            duration: challengeData.duration,
            startDate: new Date(challengeData.startDate),
            endDate: new Date(challengeData.endDate),
            isPublic: challengeData.isPublic,
            inviteCode: challengeData.inviteCode,
            maxParticipants: challengeData.maxParticipants,
            status: challengeData.status,
            creatorId: challengeData.creatorId
          }
        });
        
        await prisma.$disconnect();
        
        console.log('✅ Challenge created successfully in database');
        res.status(201).json(challenge);
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
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
          
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
          // Import Prisma client
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
          
          // Get all public challenges from database
          const challenges = await prisma.challenge.findMany({
            where: { isPublic: true },
            include: {
              creator: true,
              participants: {
                include: {
                  user: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          });
          
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
          
          await prisma.$disconnect();
          
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
