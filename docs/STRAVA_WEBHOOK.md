# Strava webhooks (push subscriptions)

Strava can **POST** events to your app when an activity is created/updated/deleted or when an athlete revokes access—so you avoid polling `/athlete/activities` on a timer.

Official docs: [Webhooks](https://developers.strava.com/docs/webhooks/).

**Implementation note:** Other open-source apps (Express, Ruby, GCP, etc.) only illustrate the **same Strava contract** (GET challenge echo, POST events, `push_subscriptions` registration). This repo’s code is **written for our stack**: Vercel Node serverless routes under `api/`, shared modules in `server/`, `pg` + existing `User` / `Activity` / `Participation` tables, and `@vercel/functions` `waitUntil` for async work—not a port of any sample repo.

## What we implemented

| Piece | Purpose |
|--------|---------|
| `GET /api/strava/webhook` | Subscription validation — echoes `hub.challenge` when `hub.verify_token` matches `STRAVA_WEBHOOK_VERIFY_TOKEN`. |
| `POST /api/strava/webhook` | Receives events; responds `200` immediately and processes asynchronously via `waitUntil` (`@vercel/functions`). |
| `server/stravaWebhookProcessor.ts` | Handles athlete deauth, activity delete, activity create/update (fetches `GET /activities/{id}` once per event). |
| `server/stravaTokenRefresh.ts` | Refreshes access tokens when expired before calling the Strava API. |
| `scripts/register-strava-webhook.mjs` | Registers (or replaces) the **single** app-wide subscription at Strava. |

## Environment variables

Set on **Vercel Production** (and locally if you test subscriptions):

- **`STRAVA_WEBHOOK_VERIFY_TOKEN`** — long random secret (e.g. `openssl rand -hex 24`). Must be identical when you run the registration script and when the app validates `GET` requests.
- **`STRAVA_CLIENT_ID`** / **`STRAVA_CLIENT_SECRET`** — already used for OAuth.
- **`FRONTEND_URL`** — canonical HTTPS origin (e.g. `https://iraceapp.vercel.app`) used to build `callback_url` (`{FRONTEND_URL}/api/strava/webhook`).

## Register the subscription (once per app)

Strava allows **one** subscription per API application. After deploy:

1. Set `STRAVA_WEBHOOK_VERIFY_TOKEN` in Vercel and redeploy if needed.
2. From your machine (with env vars loaded, or `vercel env pull`):

   ```bash
   npm run strava:webhook-register
   ```

The script **lists** existing subscriptions, **deletes** them, then **creates** a new one pointing at your production `callback_url`.

Strava will issue a **GET** to your callback to validate it—your server must respond within ~2 seconds (handled by `api/strava/webhook.js`).

## Local development

To receive real Strava webhooks locally you need a public HTTPS URL (e.g. ngrok) and to register that URL with Strava, or use the [Strava webhook example](https://developers.strava.com/docs/webhookexample) flow. Most teams only register **production** `callback_url`.

## Rate limits

Webhook delivery does not replace **every** Strava API call: on each relevant activity event we still call **`GET /activities/{id}`** to load details (one read per event). That is far cheaper than polling the full activity list on an interval. See [Rate limits](https://developers.strava.com/docs/rate-limits/).

## Privacy / scopes

Webhook visibility rules match Strava’s docs: apps without `activity:read_all` may see `delete`/`create` when visibility changes. We store activities consistent with your existing sync model and must respect activity privacy per the [API Agreement](https://www.strava.com/legal/api).
