import React, { useState } from 'react';

const TestStrava: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testStravaConnection = async () => {
    setLoading(true);
    setResult('Testing Strava connection...');
    
    try {
      // First, let's try to get a fresh access token using your client credentials
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: '169822',
          client_secret: 'ac6921be29eb6fadaec73dc5bd2803dc5ee1b62c',
          grant_type: 'client_credentials',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        setResult(`❌ Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}\n${errorText}`);
        return;
      }

      const tokenData = await tokenResponse.json();
      setResult(`✅ Got access token: ${tokenData.access_token.substring(0, 20)}...\n\n`);

      // Now let's try to get your athlete info using the token
      const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!athleteResponse.ok) {
        const errorText = await athleteResponse.text();
        setResult(prev => prev + `❌ Athlete request failed: ${athleteResponse.status} ${athleteResponse.statusText}\n${errorText}`);
        return;
      }

      const athlete = await athleteResponse.json();
      setResult(prev => prev + `✅ Athlete info received:\n` +
        `Name: ${athlete.firstname} ${athlete.lastname}\n` +
        `ID: ${athlete.id}\n` +
        `Profile: ${athlete.profile}\n` +
        `City: ${athlete.city || 'N/A'}\n` +
        `Country: ${athlete.country || 'N/A'}\n\n` +
        `Your Strava credentials are working! 🎉`
      );

    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Test Strava Connection</h2>
      <p className="text-gray-600 mb-4">
        This will test if your Strava client credentials are still valid by making a simple API call.
      </p>
      
      <button
        onClick={testStravaConnection}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Strava API'}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-3 rounded border">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestStrava;
