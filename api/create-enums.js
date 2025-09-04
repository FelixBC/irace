import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();

  try {
    console.log('🔧 Creating enum types in database...');

    // Create enum types one by one
    const enumTypes = [
      {
        name: 'Sport',
        values: "ENUM ('RUNNING', 'CYCLING', 'SWIMMING', 'WALKING', 'HIKING', 'YOGA', 'WEIGHT_TRAINING')"
      },
      {
        name: 'ChallengeType', 
        values: "ENUM ('DISTANCE', 'TIME', 'FREQUENCY')"
      },
      {
        name: 'ChallengeStatus',
        values: "ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'DRAFT')"
      },
      {
        name: 'ParticipationStatus',
        values: "ENUM ('ACTIVE', 'COMPLETED', 'DROPPED', 'INVITED')"
      }
    ];

    // Also create array types for each enum
    const arrayTypes = [
      'Sport[]',
      'ChallengeType[]', 
      'ChallengeStatus[]',
      'ParticipationStatus[]'
    ];

    const results = [];

    for (const enumType of enumTypes) {
      try {
        await prisma.$executeRawUnsafe(`CREATE TYPE "public"."${enumType.name}" AS ${enumType.values};`);
        console.log(`✅ Created ${enumType.name} enum type`);
        results.push({ name: enumType.name, status: 'created' });
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ ${enumType.name} enum type already exists`);
          results.push({ name: enumType.name, status: 'already_exists' });
        } else {
          console.error(`❌ Failed to create ${enumType.name}:`, error.message);
          results.push({ name: enumType.name, status: 'failed', error: error.message });
        }
      }
    }

    // Test array types by trying to use them
    console.log('\n🔧 Testing array types for enums...');
    for (const arrayType of arrayTypes) {
      try {
        // Test if the array type is available by using it in a simple query
        await prisma.$executeRawUnsafe(`SELECT ARRAY[]::"public"."${arrayType}" as test;`);
        console.log(`✅ Array type ${arrayType} is available`);
        results.push({ name: arrayType, status: 'available' });
      } catch (error) {
        console.error(`❌ Array type ${arrayType} not available:`, error.message);
        results.push({ name: arrayType, status: 'failed', error: error.message });
      }
    }

    // Test the enums by trying to create a simple challenge
    console.log('\n🧪 Testing enum creation with a simple challenge...');
    let testResult = null;
    try {
      const testChallenge = await prisma.challenge.create({
        data: {
          name: 'Test Challenge',
          description: 'Test description',
          sports: ['RUNNING'],
          challengeType: 'DISTANCE',
          goal: 10,
          goalUnit: 'km',
          duration: '7 days',
          inviteCode: 'TEST123',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isPublic: true,
          creatorId: 'user_78476350'
        }
      });
      console.log('✅ Test challenge created successfully!');
      testResult = { status: 'success', challengeId: testChallenge.id };
      
      // Clean up test challenge
      await prisma.challenge.delete({
        where: { id: testChallenge.id }
      });
      console.log('✅ Test challenge cleaned up');
      
    } catch (testError) {
      console.error('❌ Test challenge creation failed:', testError.message);
      testResult = { status: 'failed', error: testError.message };
    }

    await prisma.$disconnect();
    
    res.status(200).json({
      success: true,
      message: 'Enum creation completed',
      results,
      testResult
    });
    
  } catch (error) {
    console.error('❌ Enum creation failed:', error);
    await prisma.$disconnect();
    res.status(500).json({
      success: false,
      error: 'Failed to create enums',
      details: error.message
    });
  }
}
