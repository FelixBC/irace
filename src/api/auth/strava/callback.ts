export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return new Response(JSON.stringify({ error: 'Authorization code is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Exchange the authorization code for access tokens
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID || '169822',
        client_secret: process.env.STRAVA_CLIENT_SECRET || 'ac6921be29eb6fadaec73dc5bd2803dc5ee1b62c',
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Strava token exchange failed:', errorData);
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      expires_in: data.expires_in,
      athlete: data.athlete,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Strava callback error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to authenticate with Strava' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
