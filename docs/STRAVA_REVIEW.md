# Strava Developer Program — resubmission checklist

Use this when you re-apply or reply to Strava’s developer review.

**Ready-to-paste copy for the submission form, scope justification, and a reviewer test plan:** see [`STRAVA_SUBMISSION.md`](./STRAVA_SUBMISSION.md).

## Product positioning (use in the submission form)

- **What it is:** Invite-only **community fitness challenges** for small groups. Users explicitly opt in to see **aggregated challenge progress** (e.g. distance toward a goal) with other **participants in the same challenge** — not a global leaderboard of Strava users, not a copy of Strava’s product.
- **Data model:** Strava API data is used per authenticated user; **cross-user display** is limited to **challenge metrics** the user agreed to share with co-participants, documented in-app and in the Privacy Policy.

## Technical / policy items implemented in this repo

1. **No OAuth secrets in the browser** — `client_secret` only on server; token refresh via `POST /api/strava/refresh-token`.
2. **Server-side OAuth callback** — `/api/auth/strava/callback` exchanges the code and sets session; `FRONTEND_URL` controls redirect (set in Vercel env).
3. **Strava disconnect** — `POST /api/strava/disconnect` (session auth) calls Strava deauthorize, clears `User.stravaTokens`, deletes that user’s `Activity` rows; **Profile → Settings → Disconnect** and header menu use it (documented in `/privacy`).
4. **Consent before join / create** — UI + API require acknowledgements; DB fields `Participation.challengeDataConsentAt` / `Challenge.creatorParticipantSharingAckAt` (run Prisma migration).
5. **Public Privacy Policy & Terms** — `/privacy`, `/terms`; footer + support email via `VITE_SUPPORT_EMAIL`; policies describe disconnect vs full deletion.
6. **Strava attribution** — footer links to Strava and the API Agreement; trademark disclaimer where appropriate.
7. **Removed debug / unsafe patterns** — e.g. client-side token exchange with embedded secrets, public “clean DB” style endpoints (removed from callback).

## Environment variables to set (production)

| Variable | Purpose |
|----------|---------|
| `VITE_STRAVA_CLIENT_ID` | Public Strava client id (same as `STRAVA_CLIENT_ID` value) |
| `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | Server OAuth & refresh |
| `DATABASE_URL` | Postgres |
| `FRONTEND_URL` | Canonical site URL for OAuth redirect back from Strava |
| `VITE_SUPPORT_EMAIL` | Shown in Privacy Policy & footer |

## Strava app settings (required for “Connect Strava”)

In [My API Application](https://www.strava.com/settings/api) (Strava → Settings → My API Application):

1. **Authorization Callback Domain** — enter **only the hostname**, no `https://` and no path.  
   For production: `stravaracer.vercel.app`  
   (This allows any path on that host, including `/api/auth/strava/callback`.)
2. **Website** — set to your public site URL, e.g. `https://stravaracer.vercel.app`.

`localhost` and `127.0.0.1` are always allowed for local dev; production **must** use the domain above (or Strava returns `redirect_uri` **invalid** on authorize).

**Verify before testing in the browser** (replace `CLIENT_ID` with your app id):

```bash
curl -sS "https://www.strava.com/oauth/authorize?client_id=CLIENT_ID&redirect_uri=https%3A%2F%2Fstravaracer.vercel.app%2Fapi%2Fauth%2Fstrava%2Fcallback&response_type=code&scope=read%2Cactivity%3Aread_all"
```

- **Success:** HTTP `302` (redirect to Strava login).
- **Failure:** HTTP `400` JSON with `"field":"redirect_uri","code":"invalid"` → fix the callback domain in Strava, then save.

Also ensure **`FRONTEND_URL`** and **`VITE_APP_ORIGIN`** on Vercel both resolve to `https://stravaracer.vercel.app` so the same `redirect_uri` is used in the browser and in the server token exchange.

## Before you resubmit

- [ ] Run DB migration (`challengeDataConsentAt`, `creatorParticipantSharingAckAt`).
- [ ] Set all env vars on Vercel; redeploy.
- [ ] Strava **Authorization Callback Domain** = `stravaracer.vercel.app` (hostname only); verify with the curl above.
- [ ] Screenshot: join flow with consent + Privacy link; challenge create acknowledgement; Privacy page.
- [ ] Optional: email `developers@strava.com` to confirm your use case fits a **community / group** app if you want written clarity.

This document is internal guidance only and is not legal advice.
