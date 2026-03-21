/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRAVA_CLIENT_ID: string;
  readonly VITE_SUPPORT_EMAIL: string;
  /** Canonical site origin (e.g. https://stravaracer.vercel.app) — keeps Strava redirect_uri stable */
  readonly VITE_APP_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
