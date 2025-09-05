export default async function handler(req, res) {
  console.log('🏃‍♂️ === STRAVA SYNC API ===');
  console.log('📋 Request method:', req.method);
  console.log('📋 Request body:', req.body);

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, challengeId } = req.body;

    if (!userId) {
      console.log('❌ User ID is required');
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('🔄 Syncing Strava activities for user:', userId, 'challenge:', challengeId);

    // Disable SSL verification for this request
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Use native pg client to avoid Prisma prepared statement issues
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });

    try {
      await client.connect();
      console.log('✅ Database connected successfully with native pg client');

      // Get user's Strava tokens
      const userResult = await client.query(`
        SELECT "stravaTokens", "stravaId" 
        FROM "User" 
        WHERE "id" = $1
      `, [userId]);

      if (userResult.rows.length === 0) {
        await client.end();
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];
      const stravaTokens = user.stravaTokens;

      if (!stravaTokens || !stravaTokens.access_token) {
        await client.end();
        return res.status(400).json({ error: 'User not connected to Strava' });
      }

      // Get challenge details if challengeId provided
      let challenge = null;
      if (challengeId) {
        const challengeResult = await client.query(`
          SELECT "id", "sports", "startDate", "endDate", "sportGoals"
          FROM "Challenge" 
          WHERE "id" = $1
        `, [challengeId]);
        
        if (challengeResult.rows.length > 0) {
          challenge = challengeResult.rows[0];
        }
      }

      // Fetch activities from Strava
      console.log('🔄 Fetching activities from Strava...');
      const activitiesResponse = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=200', {
        headers: {
          'Authorization': `Bearer ${stravaTokens.access_token}`
        }
      });

      if (!activitiesResponse.ok) {
        const errorData = await activitiesResponse.json();
        console.error('❌ Failed to fetch Strava activities:', errorData);
        await client.end();
        return res.status(500).json({ error: 'Failed to fetch Strava activities', details: errorData });
      }

      const activities = await activitiesResponse.json();
      console.log(`✅ Fetched ${activities.length} activities from Strava`);

      // Filter activities based on challenge if provided
      let relevantActivities = activities;
      if (challenge) {
        const challengeStartDate = new Date(challenge.startDate);
        const challengeEndDate = new Date(challenge.endDate);
        const challengeSports = challenge.sports;

        relevantActivities = activities.filter(activity => {
          const activityDate = new Date(activity.start_date);
          const isInDateRange = activityDate >= challengeStartDate && activityDate <= challengeEndDate;
          const isRelevantSport = challengeSports.includes(activity.sport_type);
          return isInDateRange && isRelevantSport;
        });

        console.log(`✅ Filtered to ${relevantActivities.length} relevant activities for challenge`);
      }

      // Process and store activities
      let syncedCount = 0;
      let totalDistance = 0;

      for (const activity of relevantActivities) {
        try {
          // Check if activity already exists
          const existingActivityResult = await client.query(`
            SELECT "id" 
            FROM "Activity" 
            WHERE "stravaActivityId" = $1
          `, [activity.id.toString()]);

          if (existingActivityResult.rows.length > 0) {
            console.log(`⏭️ Activity ${activity.id} already synced, skipping`);
            continue;
          }

          // Map Strava sport types to our sport enum
          const sportMapping = {
            'Run': 'RUNNING',
            'Ride': 'CYCLING',
            'Swim': 'SWIMMING',
            'Walk': 'WALKING',
            'Hike': 'HIKING',
            'Yoga': 'YOGA',
            'WeightTraining': 'WEIGHT_TRAINING'
          };

          const sport = sportMapping[activity.sport_type] || 'RUNNING';
          const distance = activity.distance / 1000; // Convert meters to kilometers
          const duration = activity.moving_time; // Duration in seconds

          // Insert activity
          const activityId = `activity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          
          await client.query(`
            INSERT INTO "Activity" (
              "id", "stravaActivityId", "userId", "challengeId", "sport",
              "distance", "duration", "date", "synced", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            activityId,
            activity.id.toString(),
            userId,
            challengeId || null,
            sport,
            distance,
            duration,
            new Date(activity.start_date),
            true,
            new Date(),
            new Date()
          ]);

          totalDistance += distance;
          syncedCount++;

        } catch (activityError) {
          console.error(`❌ Error processing activity ${activity.id}:`, activityError);
          // Continue with other activities
        }
      }

      // Update participation progress if challengeId provided
      if (challengeId && syncedCount > 0) {
        await client.query(`
          UPDATE "Participation" 
          SET 
            "currentDistance" = "currentDistance" + $1,
            "lastActivityDate" = NOW(),
            "updatedAt" = NOW()
          WHERE "userId" = $2 AND "challengeId" = $3
        `, [totalDistance, userId, challengeId]);

        console.log(`✅ Updated participation progress: +${totalDistance.toFixed(2)}km`);
      }

      await client.end();
      console.log(`✅ Strava sync completed: ${syncedCount} activities synced, ${totalDistance.toFixed(2)}km total`);

      res.status(200).json({
        success: true,
        message: 'Strava activities synced successfully',
        syncedCount: syncedCount,
        totalDistance: totalDistance,
        activities: relevantActivities.length
      });

    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      try {
        await client.end();
      } catch (e) {
        console.log('⚠️ Error closing client:', e.message);
      }
      return res.status(500).json({
        error: 'Failed to sync Strava activities',
        details: dbError.message
      });
    }

  } catch (error) {
    console.error('❌ Error in Strava sync:', error);
    res.status(500).json({
      error: 'Strava sync failed',
      details: error.message
    });
  }
}
