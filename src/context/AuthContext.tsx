import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StravaTokens } from '../types';
import { API_BASE_URL, SESSION } from '../config/api';
import { assertOk, getAuthHeader, readJson } from '../lib/apiClient';
import { createLogger } from '../lib/logger';

const log = createLogger('auth');

interface AuthContextType {
  user: User | null;
  isConnectedToStrava: boolean;
  disconnectStrava: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  stravaTokens: StravaTokens | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stravaTokens, setStravaTokens] = useState<StravaTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

    const checkExistingSession = async (signal?: AbortSignal) => {
      try {
        const sessionToken = localStorage.getItem('session_token');
        if (!sessionToken) {
          setUser(null);
          setStravaTokens(null);
          return;
        }

        const response = await fetch(SESSION, {
          headers: { ...getAuthHeader() },
          signal,
        });

        if (!response.ok) {
          localStorage.removeItem('session_token');
          setUser(null);
          setStravaTokens(null);
          return;
        }

        const userData = await readJson<{ user: User; stravaTokens?: StravaTokens | null }>(response);
        setUser(userData.user);
        setStravaTokens(userData.stravaTokens ?? null);
      } catch (error) {
        // Ignore aborts; otherwise treat as auth failure so we don't stick in a half-state.
        if ((error as { name?: string } | null)?.name !== 'AbortError') {
          log.error('existing session check failed', error);
          localStorage.removeItem('session_token');
          setUser(null);
          setStravaTokens(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const controller = new AbortController();
    void checkExistingSession(controller.signal);
    return () => {
      controller.abort();
    };
  }, []);

  const disconnectStrava = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      setStravaTokens(null);
      setUser(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/strava/disconnect`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
      });
      await assertOk(res, 'Failed to disconnect Strava');
      const sessionRes = await fetch(SESSION, {
        headers: { ...getAuthHeader() },
      });
      if (sessionRes.ok) {
        const data = await readJson<{ user: User; stravaTokens?: StravaTokens | null }>(sessionRes);
        setUser(data.user);
        setStravaTokens(data.stravaTokens ?? null);
      } else {
        setStravaTokens(null);
        setUser((prev) => (prev ? { ...prev, stravaTokens: undefined } : null));
      }
    } catch (e) {
      log.error('disconnectStrava failed', e);
      throw e;
    }
  };

  const logout = () => {
    setUser(null);
    setStravaTokens(null);
    localStorage.removeItem('session_token');
    // Redirect to dashboard after logout
    window.location.href = '/';
  };

  const isConnectedToStrava = !!stravaTokens && !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      isConnectedToStrava, 
      disconnectStrava, 
      logout, 
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