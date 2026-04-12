# Architecture notes

## API routes (Vercel)

Handlers under **`api/`** are **TypeScript** (`VercelRequest` / `VercelResponse` from `@vercel/node`). Shared helpers live in **`server/`** (mostly JavaScript today). Local API typecheck: `npm run typecheck:api`.

- **`GET /api/challenges/user/:userId`** — requires `Authorization: Bearer <session>`; only returns data when the session user matches `userId`. Response includes **`myProgress`** (0–100) from the caller’s `Participation.currentDistance` vs `Challenge.goal`. Shared helpers: `server/apiHelpers.ts`, `server/myChallengeProgress.ts`.

## Database: Prisma

The app uses **[Prisma](https://www.prisma.io/)** for the PostgreSQL schema, migrations, and all runtime database access from API routes and server workers.

- Per-request / serverless handlers use **`createFreshPrismaClient()`** from `server/prisma.ts` and **`$disconnect()`** in `finally` blocks.
- **`src/lib/db.ts`** and other app code use the shared client where appropriate; reserve **`$queryRaw`** only for queries that cannot be expressed cleanly in the Prisma API.

## Logging

Scoped loggers live in `server/logger.ts` (Node) and `src/lib/logger.ts` (browser). See inline comments for `LOG_DEBUG` on the server.

## Shared modules

- **`shared/stravaSportType.js`** — maps Strava activity `type` / `sport_type` strings to Prisma `Sport` enum values. Imported from `server/*`, Vite (`src/`), and covered by tests.

## Tests

- **Vitest** (`npm run test`): `shared/*.test.ts`, `server/*.test.ts` — pure helpers (`normalizeSports`, Strava sport mapping, opt-in TLS env). API routes stay integration-tested manually or via staging until you add HTTP-level tests.

## Docs index

- Deployment / DB: `DATABASE_VERCEL.md`, `VERCEL_DOMAIN.md`
- Strava: `STRAVA_WEBHOOK.md`, `STRAVA_SUBMISSION.md`, `STRAVA_REVIEW.md`
- Push: `WEB_PUSH.md`
