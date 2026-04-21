import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getStravaCallbackUrl } from '../../config/urls';

/**
 * Strava may redirect here if the app URL was misconfigured.
 * Token exchange must happen only on the server (`/api/auth/strava/callback`).
 * If we see `code`, forward to the server callback; never put client_secret in the browser.
 */
const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const scope = searchParams.get('scope');

    if (code) {
      const callback = getStravaCallbackUrl();
      const params = new URLSearchParams();
      params.set('code', code);
      if (state) params.set('state', state);
      if (scope) params.set('scope', scope);
      window.location.replace(`${callback}?${params.toString()}`);
      return;
    }

    const exchange = searchParams.get('exchange');
    if (exchange) {
      navigate(`/?exchange=${encodeURIComponent(exchange)}`, { replace: true });
      return;
    }

    setError('No OAuth data received. Use “Connect Strava” from the home page.');
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
        <p className="text-gray-600">Connecting to Strava…</p>
        <p className="text-sm text-gray-500 mt-2">Securing your session on our servers</p>
      </div>
    </div>
  );
};

export default AuthCallback;
