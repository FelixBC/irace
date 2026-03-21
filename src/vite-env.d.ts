/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRAVA_CLIENT_ID: string;
  readonly VITE_SUPPORT_EMAIL: string;
  /** Canonical site origin (e.g. https://iraceapp.vercel.app) — keeps Strava OAuth redirect_uri stable */
  readonly VITE_APP_ORIGIN?: string;
  /** Web Push VAPID public key (same value as server `VAPID_PUBLIC_KEY`); omit until you enable push */
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
