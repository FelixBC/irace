import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiBaseUrl } from '../config/urls';
import { User, StravaTokens } from '../types';
import { SESSION } from '../config/api';
import { createLogger } from '../lib/logger';

const log = createLogger('auth');

interface AuthContextType {
  user: User | null;
  isConnectedToStrava: boolean;
  connectStrava: () => void;
  disconnectStrava: () => Promise<void>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
  isLoading: boolean;
  stravaTokens: StravaTokens | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stravaTokens, setStravaTokens] = useState<StravaTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastApiCall, setLastApiCall] = useState<number>(0);
  const [apiCallCount, setApiCallCount] = useState<number>(0);

  useEffect(() => {
    // Check for session token in URL parameters (from Strava callback)
    const urlParams = new URLSearchParams(window.location.search);
    const sessionTokenFromUrl = urlParams.get('session');
    
    if (sessionTokenFromUrl) {
      log.debug('session token from OAuth redirect stored');
      localStorage.setItem('session_token', sessionTokenFromUrl);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check for existing user session on app load
    const checkExistingSession = async () => {
      try {
        // Try to get user from API using stored session token
        const sessionToken = localStorage.getItem('session_token');
        
        if (sessionToken) {
          try {
            const response = await fetch(SESSION, {
              headers: {
                'Authorization': `Bearer ${sessionToken}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              setUser(userData.user);
              setStravaTokens(userData.stravaTokens);
            } else {
              // Session invalid, clear it
              localStorage.removeItem('session_token');
              setUser(null);
              setStravaTokens(null);
            }
          } catch (error) {
            log.error('session check failed', error);
            localStorage.removeItem('session_token');
            setUser(null);
            setStravaTokens(null);
          }
        }
      } catch (error) {
        log.error('existing session check failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();

    // Listen for storage events to update state when tokens/user data changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'strava_tokens') {
        log.debug('strava_tokens storage event');
        const tokens = event.newValue ? JSON.parse(event.newValue) : null;
        setStravaTokens(tokens);
        
        // If we have tokens, try to get user data
        if (tokens) {
          checkExistingSession();
        }
      }
      
      if (event.key === 'user_updated') {
        log.debug('user_updated storage event');
        const userData = event.newValue ? JSON.parse(event.newValue) : null;
        if (userData) {
          setUser(userData);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for tokens in localStorage on mount
    const storedTokens = localStorage.getItem('strava_tokens');
    if (storedTokens) {
      const tokens = JSON.parse(storedTokens);
      setStravaTokens(tokens);
      // Check if tokens are still valid
      if (tokens.expires_at * 1000 > Date.now()) {
        checkExistingSession();
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Rate limiting function to prevent too many API calls
  const canMakeApiCall = (): boolean => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    
    // Allow max 1 call per 2 seconds
    if (timeSinceLastCall < 2000) {
      log.debug('rate limit: min interval');
      return false;
    }

    if (apiCallCount >= 5 && timeSinceLastCall < 60000) {
      log.debug('rate limit: max calls per minute');
      return false;
    }
    
    return true;
  };

  const fetchUserProfile = async (tokens: StravaTokens) => {
    // Check rate limiting first
    if (!canMakeApiCall()) {
      log.debug('skip profile fetch: rate limited');
      return;
    }

    if (!tokens || !tokens.access_token || tokens.expires_at * 1000 <= Date.now()) {
      log.debug('skip profile fetch: token missing or expired');
      // Clear invalid session
      localStorage.removeItem('session_token');
      setStravaTokens(null);
      setUser(null);
      return;
    }

    try {
      // Update API call tracking
      setLastApiCall(Date.now());
      setApiCallCount(prev => prev + 1);
      
      const response = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      if (response.ok) {
        const athlete = await response.json();
        const userData: User = {
          id: athlete.id.toString(),
          name: `${athlete.firstname} ${athlete.lastname}`,
          email: athlete.email || undefined,
          image: athlete.profile,
          stravaId: athlete.id.toString(),
          stravaTokens: tokens
        };

        // Save user to API and get session token
        try {
          const saveResponse = await fetch(`${getApiBaseUrl()}/user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: userData.name,
              email: userData.email,
              image: userData.image,
              stravaId: athlete.id.toString(),
              stravaTokens: tokens
            }),
          });

          if (saveResponse.ok) {
            const result = await saveResponse.json();
            
            // Store session token
            localStorage.setItem('session_token', result.sessionToken);
            
            // Update user data with database ID
            userData.id = result.user.id;
            
            setUser(userData);
            setStravaTokens(tokens);
          } else {
            throw new Error('Failed to save user to database');
          }
        } catch (dbError) {
          log.error('save user failed', dbError);
          throw new Error('Failed to save user data. Please try again.');
        }
      } else if (response.status === 401 || response.status === 429) {
        log.debug('Strava token rejected, clearing session', response.status);
        localStorage.removeItem('session_token');
        setStravaTokens(null);
        setUser(null);
      }
    } catch (error) {
      log.error('fetch Strava profile failed', error);
      // On any error, clear the session
      localStorage.removeItem('session_token');
      setStravaTokens(null);
      setUser(null);
      throw error;
    }
  };

  const connectStrava = () => {
    // This will be handled by the Strava OAuth flow
    // The actual connection happens in the callback component
  };

  const disconnectStrava = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      setStravaTokens(null);
      setUser(null);
      return;
    }
    try {
      const res = await fetch(`${getApiBaseUrl()}/strava/disconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to disconnect Strava');
      }
      localStorage.removeItem('strava_tokens');
      const sessionRes = await fetch(SESSION, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (sessionRes.ok) {
        const data = await sessionRes.json();
        setUser(data.user);
        setStravaTokens(data.stravaTokens ?? null);
      } else {
        setStravaTokens(null);
        setUser((prev) => (prev ? { ...prev, stravaTokens: undefined } : null));
      }
      setLastApiCall(0);
      setApiCallCount(0);
    } catch (e) {
      log.error('disconnectStrava failed', e);
      throw e;
    }
  };

  const logout = () => {
    setUser(null);
    setStravaTokens(null);
    localStorage.removeItem('session_token');
    // Reset rate limiting
    setLastApiCall(0);
    setApiCallCount(0);
    // Redirect to dashboard after logout
    window.location.href = '/';
  };

  const refreshUserProfile = async (): Promise<void> => {
    if (stravaTokens) {
      await fetchUserProfile(stravaTokens);
    }
  };

  const isConnectedToStrava = !!stravaTokens && !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      isConnectedToStrava, 
      connectStrava, 
      disconnectStrava, 
      logout, 
      refreshUserProfile,
      isLoading,
      stravaTokens 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };