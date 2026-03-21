/**
 * Strava OAuth requires redirect_uri to match the **Authorization Callback Domain** in your Strava app.
 * Always use one canonical production URL (set `VITE_APP_ORIGIN` on Vercel) so OAuth works even when
 * users land on a deployment-specific `*.vercel.app` hostname.
 */
const PRODUCTION_ORIGIN = 'https://iraceapp.vercel.app';

export const PRODUCTION_URLS = {
  MAIN_APP: PRODUCTION_ORIGIN,
  STRAVA_CALLBACK: `${PRODUCTION_ORIGIN}/api/auth/strava/callback`,
  API_BASE: `${PRODUCTION_ORIGIN}/api`,
  FRONTEND: PRODUCTION_ORIGIN,
};

export const LOCAL_URLS = {
  MAIN_APP: 'http://localhost:5173',
  STRAVA_CALLBACK: 'http://localhost:5173/api/auth/strava/callback',
  API_BASE: 'http://localhost:5173/api',
  FRONTEND: 'http://localhost:5173',
};

function urlsFromOrigin(origin: string) {
  return {
    MAIN_APP: origin,
    STRAVA_CALLBACK: `${origin}/api/auth/strava/callback`,
    API_BASE: `${origin}/api`,
    FRONTEND: origin,
  };
}

function canonicalBrowserOrigin(): string | null {
  const fromEnv = import.meta.env.VITE_APP_ORIGIN?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  return null;
}

export function getUrls() {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return LOCAL_URLS;
  }

  if (typeof window !== 'undefined') {
    const canonical = canonicalBrowserOrigin();
    if (canonical) {
      return urlsFromOrigin(canonical);
    }
    return urlsFromOrigin(window.location.origin);
  }

  return PRODUCTION_URLS;
}

export function getStravaCallbackUrl(): string {
  return getUrls().STRAVA_CALLBACK;
}

export function getMainAppUrl(): string {
  return getUrls().MAIN_APP;
}

export function getApiBaseUrl(): string {
  return getUrls().API_BASE;
}
