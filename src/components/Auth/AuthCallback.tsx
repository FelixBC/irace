import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  // Check if we've made too many requests recently
  const checkRateLimit = () => {
    const lastAttempt = localStorage.getItem('strava_last_attempt');
    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
      if (timeSinceLastAttempt < 60000) { // 1 minute cooldown
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed) {
      return;
    }

    // Check if we already have tokens (prevent unnecessary processing)
    const existingTokens = localStorage.getItem('strava_tokens');
    if (existingTokens) {
      console.log('🔄 Tokens already exist, redirecting...');
      setHasProcessed(true);
      setTimeout(() => navigate('/', { replace: true }), 100);
      return;
    }

    const handleCallback = async () => {
      try {
        console.log('🔄 Starting OAuth callback...');
        setHasProcessed(true); // Mark as processed
        
        // Check rate limiting
        if (!checkRateLimit()) {
          setError('Too many requests. Please wait a minute before trying again.');
          setIsLoading(false);
          return;
        }

        const code = searchParams.get('code');
        console.log('📝 Authorization code received:', code ? 'Yes' : 'No');
        
        if (!code) {
          setError('No authorization code received');
          setIsLoading(false);
          return;
        }

        // Record this attempt
        localStorage.setItem('strava_last_attempt', Date.now().toString());

        console.log('🔑 Exchanging code for tokens...');
        
        // Exchange code for tokens directly with Strava
        const response = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: '169822', // Your Strava Client ID
            client_secret: 'ac6921be29eb6fadaec73dc5bd2803dc5ee1b62c', // Your Strava Client Secret
            code,
            grant_type: 'authorization_code',
          }),
        });

        if (!response.ok) {
          let errorMessage = 'Failed to authenticate with Strava';
          
          if (response.status === 429) {
            errorMessage = 'Too many requests to Strava. Please wait a few minutes and try again.';
          } else if (response.status === 400) {
            errorMessage = 'Invalid request. Please try connecting again.';
          } else if (response.status === 401) {
            errorMessage = 'Authentication failed. Please try again.';
          } else if (response.status === 500) {
            errorMessage = 'Strava server error. Please try again later.';
          }
          
          console.error('❌ Strava API error:', response.status, response.statusText);
          throw new Error(errorMessage);
        }

        const tokens = await response.json();
        console.log('✅ Tokens received successfully');
        
        // Store tokens in localStorage
        const tokenData = {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
          expires_in: tokens.expires_in,
          athlete: tokens.athlete,
        };
        
        localStorage.setItem('strava_tokens', JSON.stringify(tokenData));
        console.log('💾 Tokens stored in localStorage');
        
        // Trigger a storage event to notify other components
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'strava_tokens',
          newValue: JSON.stringify(tokenData)
        }));
        
        console.log('🔄 Redirecting to home page...');
        
        // Redirect to home page with a small delay to ensure storage is updated
        setTimeout(() => {
          try {
            navigate('/', { replace: true });
          } catch (navError) {
            console.error('Navigation failed, using window.location:', navError);
            // Fallback to window.location if navigation fails
            window.location.href = '/';
          }
        }, 500);
        
        // Don't set loading to false here - let the redirect happen
        // This prevents the error state from flashing
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to authenticate with Strava');
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to Strava...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we authenticate your account</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  // Show success state if not loading and no error
  if (!isLoading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-500 text-xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully Connected!</h2>
          <p className="text-gray-600 mb-4">You're now connected to Strava. Redirecting...</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
