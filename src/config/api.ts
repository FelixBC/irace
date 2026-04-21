import { getApiBaseUrl } from './urls';

// API Configuration - Uses centralized URL configuration
export const API_CONFIG = {
  // Use centralized URL configuration
  get BASE_URL() {
    return getApiBaseUrl();
  },
  
  // API endpoints
  get ENDPOINTS() {
    return {
      USER: `${this.BASE_URL}/user`,
      SESSION: `${this.BASE_URL}/auth/session`,
      AUTH_EXCHANGE: `${this.BASE_URL}/auth/exchange`,
      AUTH_REFRESH: `${this.BASE_URL}/auth/refresh`,
      AUTH_LOGOUT: `${this.BASE_URL}/auth/logout`,
      CHALLENGES: `${this.BASE_URL}/challenges`,
      CHALLENGE: (id: string) => `${this.BASE_URL}/challenges/${id}`,
      USER_CHALLENGES: (userId: string) => `${this.BASE_URL}/challenges/user/${userId}`,
      JOIN_CHALLENGE: (id: string) => `${this.BASE_URL}/challenges/${id}/join`,
      UPDATE_PROGRESS: (id: string) => `${this.BASE_URL}/challenges/${id}/progress`,
    };
  }
};

// Export individual endpoints for convenience
export const {
  USER,
  SESSION,
  AUTH_EXCHANGE,
  AUTH_REFRESH,
  AUTH_LOGOUT,
  CHALLENGES,
  CHALLENGE,
  USER_CHALLENGES,
  JOIN_CHALLENGE,
  UPDATE_PROGRESS
} = API_CONFIG.ENDPOINTS;

// Export the base URL for backward compatibility
export const API_BASE_URL = API_CONFIG.BASE_URL;
