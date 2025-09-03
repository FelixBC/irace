// 🚨 IMPORTANTE: Actualizar estas URLs en cada deploy de Vercel
// 🚨 IMPORTANTE: También actualizar en Strava (Website y Authorization Callback Domain)

const PRODUCTION_URLS = {
  // URL principal de la aplicación
  MAIN_APP: 'https://project-felixbcs-projects.vercel.app',
  
  // URL del callback de Strava (debe coincidir con Strava)
  STRAVA_CALLBACK: 'https://project-felixbcs-projects.vercel.app/api/auth/strava/callback',
  
  // URL base para APIs
  API_BASE: 'https://project-felixbcs-projects.vercel.app/api',
  
  // URL para el frontend
  FRONTEND: 'https://project-felixbcs-projects.vercel.app'
};

// URLs para desarrollo local
const LOCAL_URLS = {
  MAIN_APP: 'http://localhost:5173',
  STRAVA_CALLBACK: 'http://localhost:5173/api/auth/strava/callback',
  API_BASE: 'http://localhost:5173/api',
  FRONTEND: 'http://localhost:5173'
};

// Función para obtener las URLs según el entorno
function getUrls() {
  if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development') {
    return LOCAL_URLS;
  }
  return PRODUCTION_URLS;
}

// Función específica para obtener la URL del callback de Strava
function getStravaCallbackUrl() {
  return getUrls().STRAVA_CALLBACK;
}

// Función para obtener la URL principal
function getMainAppUrl() {
  return getUrls().MAIN_APP;
}

// Función para obtener la URL base de la API
function getApiBaseUrl() {
  return getUrls().API_BASE;
}

// Función para obtener la URL del frontend
function getFrontendUrl() {
  return getUrls().FRONTEND;
}

module.exports = {
  getUrls,
  getStravaCallbackUrl,
  getMainAppUrl,
  getApiBaseUrl,
  getFrontendUrl,
  PRODUCTION_URLS,
  LOCAL_URLS
};
