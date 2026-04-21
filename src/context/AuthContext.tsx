import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, StravaTokens } from '../types';
import { API_BASE_URL, SESSION, AUTH_EXCHANGE, AUTH_LOGOUT } from '../config/api';
import { assertOk, authFetch, parseJsonResponse } from '../lib/apiClient';
import { sessionResponseSchema, authExchangeResponseSchema } from '../schemas/apiResponses';
import { createLogger } from '../lib/logger';
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from '../lib/sessionStore';

const log = createLogger('auth');

interface AuthContextType {
  user: User | null;
  isConnectedToStrava: boolean;
  disconnectStrava: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  stravaTokens: StravaTokens | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stravaTokens, setStravaTokens] = useState<StravaTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySessionPayload = useCallback((userData: User, tokens: StravaTokens | null | undefined) => {
    setUser(userData);
    setStravaTokens(tokens ?? null);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const exchangeCode = urlParams.get('exchange');

    if (exchangeCode) {
      const runExchange = async () => {
        try {
          const response = await fetch(AUTH_EXCHANGE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exchangeCode }),
          });

          if (!response.ok) {
            clearAuthTokens();
            setUser(null);
            setStravaTokens(null);
            log.error('exchange failed', response.status);
            return;
          }

          const data = await parseJsonResponse(response, authExchangeResponseSchema);
          setAuthTokens(data.accessToken, data.refreshToken, data.expiresIn);
          applySessionPayload(data.user, data.stravaTokens ?? data.user.stravaTokens);
          window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        } catch (error) {
          log.error('exchange error', error);
          clearAuthTokens();
          setUser(null);
          setStravaTokens(null);
        } finally {
          setIsLoading(false);
        }
      };

      void runExchange();
      return;
    }

    const checkExistingSession = async (signal?: AbortSignal) => {
      if (!getRefreshToken()) {
        setUser(null);
        setStravaTokens(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await authFetch(SESSION, {
          headers: { 'Content-Type': 'application/json' },
          signal,
        });

        if (!response.ok) {
          clearAuthTokens();
          setUser(null);
          setStravaTokens(null);
          return;
        }

        const userData = await parseJsonResponse(response, sessionResponseSchema);
        setUser(userData.user);
        setStravaTokens(userData.stravaTokens ?? null);
      } catch (error) {
        if ((error as { name?: string } | null)?.name !== 'AbortError') {
          log.error('existing session check failed', error);
          clearAuthTokens();
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
  }, [applySessionPayload]);

  const disconnectStrava = async () => {
    if (!getAccessToken()) {
      setStravaTokens(null);
      setUser(null);
      return;
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/strava/disconnect`, {
        method: 'POST',
      });
      await assertOk(res, 'Failed to disconnect Strava');
      const sessionRes = await authFetch(SESSION);
      if (sessionRes.ok) {
        const data = await parseJsonResponse(sessionRes, sessionResponseSchema);
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

  const logout = async () => {
    try {
      if (getAccessToken()) {
        await authFetch(AUTH_LOGOUT, { method: 'POST' }).catch(() => {});
      }
    } finally {
      clearAuthTokens();
      setUser(null);
      setStravaTokens(null);
      window.location.href = '/';
    }
  };

  const isConnectedToStrava = !!stravaTokens && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isConnectedToStrava,
        disconnectStrava,
        logout,
        isLoading,
        stravaTokens,
      }}
    >
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
