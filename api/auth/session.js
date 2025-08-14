export default function handler(req, res) {
  console.log('🔐 === SESSION API FUNCTION START ===');
  
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method === 'GET') {
      console.log('🔐 Processing GET request...');
      
      const authHeader = req.headers.authorization;
      console.log('🔐 Auth header:', authHeader);

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ No valid auth header');
        res.status(401).json({ error: 'No valid authorization header' });
        return;
      }

      const sessionToken = authHeader.replace('Bearer ', '');
      console.log('🔐 Session token:', sessionToken);

      // For now, return a mock user since we're not using the database yet
      // In the future, this would validate the session token against the database
      const mockUser = {
        id: 'user_mock',
        name: 'Felix Jose',
        email: '',
        image: 'https://lh3.googleusercontent.com/a/ACg8ocJhdQhIn4JuOOaAD-FxXG-mV6dzX26BjE3b7HufzZWVq6C14R-zSA=s96-c',
        stravaId: '78476350'
      };

      const mockStravaTokens = {
        access_token: 'mock_token',
        refresh_token: 'mock_refresh',
        expires_at: Date.now() + 3600000, // 1 hour from now
        expires_in: 3600
      };

      const response = {
        user: mockUser,
        stravaTokens: mockStravaTokens,
        message: 'Session validated successfully (JavaScript version)'
      };

      console.log('✅ Session API completed successfully');
      res.status(200).json(response);
    } else {
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    
    console.log('✅ === SESSION API FUNCTION SUCCESS ===');
  } catch (error) {
    console.error('❌ === SESSION API FUNCTION ERROR ===');
    console.error('❌ Error:', error);
    
    res.status(500).json({ 
      error: 'Session API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
