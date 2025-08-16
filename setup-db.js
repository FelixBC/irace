#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Create a test user if none exists
    const existingUser = await prisma.user.findFirst();
    if (!existingUser) {
      console.log('👤 Creating test user...');
      const testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://via.placeholder.com/150',
          stravaId: null,
          stravaTokens: null
        }
      });
      console.log('✅ Test user created:', testUser.id);
    } else {
      console.log('👤 Test user already exists');
    }
    
    // Create a test challenge if none exists
    const existingChallenge = await prisma.challenge.findFirst();
    if (!existingChallenge) {
      console.log('🏆 Creating test challenge...');
      const testChallenge = await prisma.challenge.create({
        data: {
          name: 'Test Challenge',
          description: 'A test fitness challenge',
          sports: ['RUNNING', 'CYCLING'],
          challengeType: 'DISTANCE',
          goal: 100,
          goalUnit: 'km',
          sportGoals: { 
            RUNNING: 50, 
            CYCLING: 50,
            SWIMMING: 0,
            WALKING: 0,
            HIKING: 0,
            YOGA: 0,
            WEIGHT_TRAINING: 0
          },
          duration: '1_MONTH',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isPublic: true,
          inviteCode: 'TEST123',
          maxParticipants: 10,
          status: 'ACTIVE',
          creatorId: existingUser.id
        }
      });
      console.log('✅ Test challenge created:', testChallenge.id);
    } else {
      console.log('🏆 Test challenge already exists');
    }
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
