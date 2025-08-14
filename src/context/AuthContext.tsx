import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StravaTokens } from '../types';

interface AuthContextType {
  user: User | null;
  isConnectedToStrava: boolean;
  connectStrava: () => void;
  disconnectStrava: () => void;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
  isLoading: boolean;
  stravaTokens: StravaTokens | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'https://project-3cxzjuqus-felixbcs-projects.vercel.app/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stravaTokens, setStravaTokens] = useState<StravaTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastApiCall, setLastApiCall] = useState<number>(0);
  const [apiCallCount, setApiCallCount] = useState<number>(0);

  useEffect(() => {
    // Check for existing user session on app load
    const checkExistingSession = async () => {
      try {
        // Try to get user from API using stored session token
        const sessionToken = localStorage.getItem('session_token');
        
        if (sessionToken) {
          try {
            const response = await fetch(`${API_BASE_URL}/auth/session`, {
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
            console.error('Error checking session:', error);
            localStorage.removeItem('session_token');
            setUser(null);
            setStravaTokens(null);
          }
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  // Rate limiting function to prevent too many API calls
  const canMakeApiCall = (): boolean => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    
    // Allow max 1 call per 2 seconds
    if (timeSinceLastCall < 2000) {
      console.log('Rate limit: Too soon since last API call');
      return false;
    }
    
    // Allow max 5 calls per minute
    if (apiCallCount >= 5 && timeSinceLastCall < 60000) {
      console.log('Rate limit: Too many API calls this minute');
      return false;
    }
    
    return true;
  };

  const fetchUserProfile = async (tokens: StravaTokens) => {
    // Check rate limiting first
    if (!canMakeApiCall()) {
      console.log('Rate limit exceeded, skipping API call');
      return;
    }

    // Don't make API calls if tokens are expired or invalid
    if (!tokens || !tokens.access_token || tokens.expires_at * 1000 <= Date.now()) {
      console.log('Tokens expired or invalid, skipping API call');
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
          const saveResponse = await fetch(`${API_BASE_URL}/auth/user`, {
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
          console.error('Error saving user to database:', dbError);
          throw new Error('Failed to save user data. Please try again.');
        }
      } else if (response.status === 401 || response.status === 429) {
        // Token is invalid or rate limited, remove it
        console.log('Token invalid or rate limited, removing from storage');
        localStorage.removeItem('session_token');
        setStravaTokens(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
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

  const disconnectStrava = () => {
    setUser(null);
    setStravaTokens(null);
    localStorage.removeItem('session_token');
    // Reset rate limiting
    setLastApiCall(0);
    setApiCallCount(0);
  };

  const logout = () => {
    setUser(null);
    setStravaTokens(null);
    localStorage.removeItem('session_token');
    // Reset rate limiting
    setLastApiCall(0);
    setApiCallCount(0);
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