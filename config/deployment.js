// 🚨 IMPORTANTE: Actualizar estas URLs en cada deploy de Vercel
// 🚨 IMPORTANTE: También actualizar en Strava (Website y Authorization Callback Domain)

const DEPLOYMENT_CONFIG = {
  // URLs de la aplicación
  PRODUCTION_URLS: {
    MAIN_APP: 'https://project-qw8um6t2v-felixbcs-projects.vercel.app',
    STRAVA_CALLBACK: 'https://project-qw8um6t2v-felixbcs-projects.vercel.app/api/auth/strava/callback',
    API_BASE: 'https://project-qw8um6t2v-felixbcs-projects.vercel.app/api',
    FRONTEND: 'https://project-qw8um6t2v-felixbcs-projects.vercel.app'
  },

  // Variables de entorno que deben actualizarse
  ENVIRONMENT_VARIABLES: {
    NEXTAUTH_URL: 'https://project-qw8um6t2v-felixbcs-projects.vercel.app',
    VERCEL_URL: 'https://project-qw8um6t2v-felixbcs-projects.vercel.app'
  },

  // Configuración de Strava
  STRAVA_CONFIG: {
    WEBSITE: 'https://project-qw8um6t2v-felixbcs-projects.vercel.app',
    AUTHORIZATION_CALLBACK_DOMAIN: 'project-qw8um6t2v-felixbcs-projects.vercel.app'
  }
};

module.exports = DEPLOYMENT_CONFIG;
