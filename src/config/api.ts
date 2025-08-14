// API Configuration - Automatically detects current URL
export const API_CONFIG = {
  // Automatically detect the current domain
  get BASE_URL() {
    // In development, use localhost
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:5173/api';
    }
    
    // In production, use the current domain
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api`;
    }
    
    // Fallback for server-side rendering
    return '/api';
  },
  
  // API endpoints
  get ENDPOINTS() {
    return {
      USER: `${this.BASE_URL}/user`,
      SESSION: `${this.BASE_URL}/auth/session`,
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
  CHALLENGES,
  CHALLENGE,
  USER_CHALLENGES,
  JOIN_CHALLENGE,
  UPDATE_PROGRESS
} = API_CONFIG.ENDPOINTS;

// Export the base URL for backward compatibility
export const API_BASE_URL = API_CONFIG.BASE_URL;
