// 🚨 IMPORTANTE: Actualizar estas URLs en cada deploy de Vercel
// 🚨 IMPORTANTE: También actualizar en Strava (Website y Authorization Callback Domain)

export const PRODUCTION_URLS = {
  // URL principal de la aplicación
  MAIN_APP: 'https://project-ghv4kh72s-felixbcs-projects.vercel.app',

  // URL del callback de Strava (debe coincidir con Strava)
  STRAVA_CALLBACK: 'https://project-ghv4kh72s-felixbcs-projects.vercel.app/api/auth/strava/callback',

  // URL base para APIs
  API_BASE: 'https://project-ghv4kh72s-felixbcs-projects.vercel.app/api',

  // URL para el frontend
  FRONTEND: 'https://project-ghv4kh72s-felixbcs-projects.vercel.app'
};

// URLs para desarrollo local
export const LOCAL_URLS = {
  MAIN_APP: 'http://localhost:5173',
  STRAVA_CALLBACK: 'http://localhost:5173/api/auth/strava/callback',
  API_BASE: 'http://localhost:5173/api',
  FRONTEND: 'http://localhost:5173'
};

// Función para obtener las URLs según el entorno
export function getUrls() {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return LOCAL_URLS;
  }
  return PRODUCTION_URLS;
}

// Función específica para obtener la URL del callback de Strava
export function getStravaCallbackUrl(): string {
  return getUrls().STRAVA_CALLBACK;
}

// Función para obtener la URL principal
export function getMainAppUrl(): string {
  return getUrls().MAIN_APP;
}

// Función para obtener la URL base de la API
export function getApiBaseUrl(): string {
  return getUrls().API_BASE;
}
