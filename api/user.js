export default function handler(req, res) {
  console.log('👤 === USER API FUNCTION START ===');
  
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method === 'POST') {
      console.log('👤 Processing POST request...');
      
      const {
        name,
        email,
        image,
        stravaId,
        stravaTokens
      } = req.body;

      console.log('👤 Received user data:', { name, email, stravaId });

      // Generate a simple session token
      const sessionToken = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2);

      // Return success response
      const response = {
        user: {
          id: 'user_' + Date.now(),
          name,
          email,
          image,
          stravaId,
          stravaTokens
        },
        sessionToken,
        message: 'User data received successfully (JavaScript version)'
      };

      console.log('✅ API function completed successfully');
      res.status(200).json(response);
    } else {
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    
    console.log('✅ === USER API FUNCTION SUCCESS ===');
  } catch (error) {
    console.error('❌ === USER API FUNCTION ERROR ===');
    console.error('❌ Error:', error);
    
    res.status(500).json({ 
      error: 'API function error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
