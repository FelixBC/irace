# Architecture notes

## Database: Prisma vs `pg`

**You do not need both forever.** The repo currently uses:

| Layer | Role |
|--------|------|
| **Prisma** | Schema, migrations, type-safe queries in newer code paths (`api/challenges/taunts`, `api/push`, `server/prisma.js`, `src/lib/db.ts`, `StravaSyncService`, etc.). |
| **`pg` (native client)** | Some **legacy Vercel serverless** handlers (`api/challenges/index.js`, OAuth callback, session, Strava sync) that were written when pooled Postgres + serverless had sharp edges with Prisma’s connection model. |

**Interview-friendly justification:** *“Prisma is our standard for schema and app queries. A few hot paths still use `pg` from an earlier deploy cycle; the plan is to migrate those handlers to Prisma so we have one access layer and simpler connection handling.”*

**North star:** one access pattern (**Prisma**) everywhere; reserve raw SQL only for unusual queries or proven performance needs.

## Logging

Scoped loggers live in `server/logger.js` (Node) and `src/lib/logger.ts` (browser). See inline comments for `LOG_DEBUG` on the server.

## Docs index

- Deployment / DB: `DATABASE_VERCEL.md`, `VERCEL_DOMAIN.md`
- Strava: `STRAVA_WEBHOOK.md`, `STRAVA_SUBMISSION.md`, `STRAVA_REVIEW.md`
- Push: `WEB_PUSH.md`
