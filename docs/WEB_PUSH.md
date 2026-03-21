# Web Push (iRace)

Web Push lets the server show **browser notifications** after the user opts in. It does **not** require extra Strava API scopes as long as you only notify about in-app events (challenges, invites, etc.) using data you already store.

## When to turn it on in production

Shipping push is a **product** decision, not a Strava API requirement. Many teams wait until after app review so the submission story stays focused on OAuth and data use. Keeping push **disabled in production** until you are ready is fine: leave `VITE_VAPID_PUBLIC_KEY` unset on Vercel and omit the VAPID secrets until you deploy.

## Local setup

1. Run a migration so `PushSubscription` exists:

   ```bash
   npx prisma migrate deploy
   ```

   (Or `npx prisma migrate dev` in development.)

2. Generate keys:

   ```bash
   npm run generate-vapid
   ```

3. Copy the printed values into `.env` and set:

   - `VAPID_SUBJECT=mailto:you@yourdomain.com` (or another URL you control; required by the Web Push spec.)

4. Ensure `VITE_VAPID_PUBLIC_KEY` matches `VAPID_PUBLIC_KEY` (same string).

5. `npm run dev`, sign in, open **Profile → Settings**, enable **Push notifications**, then use **Send test** (dev only) if shown.

HTTPS is required for push except on `localhost`.

## API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/push/subscribe` | Bearer session | Store subscription JSON from `pushManager.subscribe` |
| `POST` | `/api/push/unsubscribe` | Bearer session | Remove subscription by `endpoint` |
| `POST` | `/api/push/test` | Bearer session | Send a test notification to the current user’s stored subscriptions |

## Files

- `public/sw.js` — service worker (push + notification click).
- `src/lib/pushNotifications.ts` — register SW, subscribe/unsubscribe, test helper.
- `api/push/*.js` — server routes; uses `web-push` and Prisma `PushSubscription`.

## Next steps (not implemented here)

Wire `webpush.sendNotification` from your domain logic when challenge events occur, and delete stale subscriptions on `410` / `404` (the test route already removes dead endpoints).
