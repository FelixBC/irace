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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stravaTokens, setStravaTokens] = useState<StravaTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastApiCall, setLastApiCall] = useState<number>(0);
  const [apiCallCount, setApiCallCount] = useState<number>(0);

  useEffect(() => {
    // Check for existing Strava tokens on app load (only once)
    const checkExistingAuth = async () => {
      try {
        const savedTokens = localStorage.getItem('strava_tokens');
        if (savedTokens) {
          const tokens: StravaTokens = JSON.parse(savedTokens);
          
          // Check if tokens are still valid BEFORE setting them in state
          if (tokens.expires_at * 1000 > Date.now()) {
            // Only set valid tokens, but don't fetch profile immediately
            // This prevents rate limiting issues on app startup
            setStravaTokens(tokens);
            // Fetch profile after a small delay to avoid immediate API calls
            setTimeout(() => fetchUserProfile(tokens), 1000);
          } else {
            // Tokens expired, remove them and don't set in state
            console.log('Existing tokens expired, removing from storage');
            localStorage.removeItem('strava_tokens');
            setStravaTokens(null);
          }
        }
      } catch (error) {
        console.error('Error checking existing auth:', error);
        localStorage.removeItem('strava_tokens');
        setStravaTokens(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingAuth();

    // Simple storage event listener for cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'strava_tokens' && e.newValue) {
        try {
          const tokens: StravaTokens = JSON.parse(e.newValue);
          // Only set tokens, don't automatically fetch profile
          setStravaTokens(tokens);
          // Only fetch profile if tokens are valid
          if (tokens.expires_at * 1000 > Date.now()) {
            fetchUserProfile(tokens);
          }
        } catch (error) {
          console.error('Error parsing updated tokens:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Reset API call count every minute
    const resetTimer = setInterval(() => {
      setApiCallCount(0);
    }, 60000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(resetTimer);
    };
  }, []); // Empty dependency array - only run once on mount

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
      // Clean up invalid tokens
      localStorage.removeItem('strava_tokens');
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
        setUser(userData);
        setStravaTokens(tokens);
      } else if (response.status === 401 || response.status === 429) {
        // Token is invalid or rate limited, remove it
        console.log('Token invalid or rate limited, removing from storage');
        localStorage.removeItem('strava_tokens');
        setStravaTokens(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // On any error, remove the tokens to prevent further issues
      localStorage.removeItem('strava_tokens');
      setStravaTokens(null);
      setUser(null);
    }
  };

  const connectStrava = () => {
    // This will be handled by the Strava OAuth flow
    // The actual connection happens in the callback component
  };



  const disconnectStrava = () => {
    setUser(null);
    setStravaTokens(null);
    localStorage.removeItem('strava_tokens');
    // Reset rate limiting
    setLastApiCall(0);
    setApiCallCount(0);
  };

  const logout = () => {
    setUser(null);
    setStravaTokens(null);
    localStorage.removeItem('strava_tokens');
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