# Agent / contributor guidance

Works for Claude Code, Cursor agent, and human contributors alike.

## Quick rules

- **Before every `git commit` or `git push`**, run the full check from the repo root:
  ```bash
  npm run verify
  ```
  This runs TypeScript (`typecheck`), ESLint (`lint`), and unit tests (`vitest run`). Fix all failures before committing. Do not bypass with `--no-verify` unless you have an explicit, documented reason.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + framer-motion
- **Routing:** react-router-dom v7 (file-based, client-side SPA)
- **Backend:** Vercel serverless functions under `api/` (TypeScript, `@vercel/node`)
- **Database:** PostgreSQL via Prisma (hosted on Neon in production)
- **Auth:** Custom JWT access tokens + opaque refresh tokens (no next-auth)
- **External API:** Strava OAuth + activity sync

## Project layout

```
api/        Vercel serverless handlers (one file = one route)
server/     Shared server-side utilities (auth tokens, Prisma client, logger, etc.)
src/        React application
  components/
  context/  React contexts (AuthContext, ThemeContext, ToastContext)
  lib/      Client-side utilities (apiClient, sessionStore, logger)
  schemas/  Zod schemas for runtime API response validation
  services/ Client-side API call wrappers
  config/   API endpoint constants
shared/     Types and utilities shared between server and client
prisma/     Schema and migrations
scripts/    One-off Node scripts (db setup, VAPID key generation, etc.)
```

## Key conventions

- **Session storage:** Auth tokens live in `sessionStorage` (via `src/lib/sessionStore.ts`) — persists through F5 in the same tab, cleared on tab close. Do not move to `localStorage`.
- **authFetch:** All authenticated API calls go through `src/lib/apiClient.ts` `authFetch`, which injects the Bearer token and handles silent access-token refresh.
- **Prisma client:** Each serverless function creates a fresh Prisma client (`createFreshPrismaClient`) and disconnects in `finally`. Do not share a global instance across functions.
- **Zod validation:** Every API response consumed by the frontend must be validated through a schema in `src/schemas/apiResponses.ts`.
- **No console.log:** Use the typed logger (`createLogger`) from `src/lib/logger.ts` (frontend) or `server/logger.ts` (backend).
- **No comments** unless the *why* is non-obvious. Never describe what the code does.

## Running the app locally

```bash
npm install        # also runs prisma generate via postinstall
npm run dev        # Vite dev server (frontend only)
```

For API routes you need the Vercel CLI (`vercel dev`) and a `.env` file — see `.env.example`.

## TypeScript

Two separate TS projects — keep them separate:

| Config | Scope |
|---|---|
| `tsconfig.app.json` | React frontend (`src/`) |
| `tsconfig.api.json` | Serverless functions (`api/`, `server/`, `shared/`) |

Run both: `npm run typecheck` (runs both in sequence).
