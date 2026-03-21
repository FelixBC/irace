# Production URL: `iraceapp.vercel.app`

## Why not `irace.vercel.app`?

On Vercel, each `*.vercel.app` hostname is **unique across the platform**. The slug **`irace.vercel.app` is already assigned to another project** (not this repo). Opening it shows that other site — which is why OAuth and screenshots failed when pointed at `irace.vercel.app`.

Your **iRace** app is the Vercel project named **`irace`** (renamed from `stravaracer`). Its deployments still carry the original production alias **`https://stravaracer.vercel.app`**. That URL continues to work.

## Canonical URL for this app

Use **`https://iraceapp.vercel.app`** as the public, iRace-branded hostname:

- Added as a **project domain** in Vercel (verified) and aliased to production.
- Matches **`PRODUCTION_ORIGIN`** in `src/config/urls.ts` and Strava/docs in this repo.

**Legacy:** `https://stravaracer.vercel.app` may still work for the same project; prefer **`iraceapp.vercel.app`** for new links, Strava settings, and env vars.

## What you must update in Vercel & Strava

1. **Vercel → Project `irace` → Settings → Environment Variables (Production):** set **`FRONTEND_URL`** and **`VITE_APP_ORIGIN`** to **`https://iraceapp.vercel.app`**, then **redeploy**.
2. **Strava → My API Application:**  
   - **Authorization Callback Domain:** `iraceapp.vercel.app` (hostname only)  
   - **Website:** `https://iraceapp.vercel.app`

## Optional: your own domain

For a cleaner brand (e.g. `irace.app`), add a **custom domain** in Vercel and set the same env vars and Strava fields to that HTTPS origin.

See also [`STRAVA_REVIEW.md`](./STRAVA_REVIEW.md) for the OAuth verification `curl` command.
