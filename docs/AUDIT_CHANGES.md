# iRace audit notes (learning doc)

This document is written to help a junior developer understand what we changed, why it matters, and which files were touched. We’ll keep app behavior stable while improving maintainability, readability, and correctness module-by-module.

## Module 1 — App shell + error boundary

### What changed
- **Added React Strict Mode** at the root render.
  - **File**: `src/main.tsx`
- **Fixed dev-only error details rendering** to use Vite’s environment flags.
  - **File**: `src/components/ui/ErrorBoundary.tsx`

### Why it matters
- **Maintainability**: Strict Mode helps catch unsafe effects and deprecated patterns early while you’re developing (it intentionally double-invokes certain lifecycles in dev to surface issues).
- **Correctness**: Vite apps shouldn’t rely on `process.env.NODE_ENV` in the browser bundle; `import.meta.env.DEV` is the supported mechanism and avoids bundler surprises.

### Touched files
- `src/main.tsx`
- `src/components/ui/ErrorBoundary.tsx`

---

## Module 2 — Auth/session (single source of truth)

### What changed
- Simplified auth state so it comes from **one place**:
  - `session_token` in `localStorage`
  - validated by calling `SESSION` (`/api/auth/session`)
  - which returns `user` and `stravaTokens`
- Removed the older path that:
  - listened to `localStorage` keys like `strava_tokens` / `user_updated`
  - called Strava directly from the browser to build a profile
  - attempted client-side “rate limiting” for those calls
- Added abort-safe session check (prevents state updates after unmount).

### Why it matters
- **Maintainability**: fewer moving parts (no duplicated “sources of truth” for user/tokens).
- **Security & boundaries**: avoids expanding the browser’s responsibilities; the server already owns token refresh and session issuance.
- **Correctness**: fewer race conditions and fewer cases where UI can display stale tokens/user info.

### Touched files
- `src/context/AuthContext.tsx`

---

## Module 3 — Services layer: consistent API errors & auth headers

### What changed
- Added a small shared API helper:
  - **File**: `src/lib/apiClient.ts`
  - Provides `ApiError`, `assertOk()`, `readJson()`, `readJsonOrNull()`, `getAuthHeader()`, `jsonAuthHeaders()`, and `jsonBearerHeaders()`
- Refactored services to use the shared helper and avoid repeated boilerplate:
  - **Files**:
    - `src/services/challengeService.ts`
    - `src/services/stravaService.ts`
- Extended the same patterns to **auth**, **push**, and **`StravaAPI`** (browser refresh path):
  - `src/context/AuthContext.tsx` — session and Strava disconnect use `getAuthHeader()`, `readJson()`, and `assertOk()`; disconnect URL uses `API_BASE_URL` (see below).
  - `src/lib/pushNotifications.ts` — JSON + Bearer headers via `jsonBearerHeaders()`.
  - `src/lib/strava.ts` — refresh-token call uses `assertOk()` / `readJson()` and `API_BASE_URL`.
- **URL fix**: Several calls used `new URL('/something', CHALLENGES)` where `CHALLENGES` is `…/api/challenges`. A path starting with `/` resolves to the **site root**, so requests incorrectly targeted `…/strava/…` and `…/challenges/taunts` **without** the `/api` prefix. Those endpoints now use `` `${API_BASE_URL}/…` `` explicitly.

### Why it matters
- **Maintainability**: one place for “how we parse errors / JSON / auth headers”.
- **Readability**: service methods become shorter and more uniform.
- **Correctness**: consistent error messages (prefer backend `error` field when available) and consistent status tracking via `ApiError.status`; API routes under `/api` are called reliably in dev and production.

### Touched files
- `src/lib/apiClient.ts`
- `src/context/AuthContext.tsx`
- `src/lib/pushNotifications.ts`
- `src/lib/strava.ts`
- `src/services/challengeService.ts`
- `src/services/stravaService.ts`

---

## Module 4 — Race view (data flow + correctness)

### What changed
- Added a small date coercion helper so we never pass string dates directly into `date-fns/format()` (which expects a `Date`).
- Removed a duplicate “fetch the challenge again” inside the Strava-load path. Now the Strava refresh uses the already-loaded `challenge` data and only refreshes activities.
- Made the refresh handler use `try/finally` so the “refreshing” spinner state always resets even on errors.

### Why it matters
- **Correctness**: backend returns JSON date strings; formatting them directly is easy to get wrong and can lead to runtime errors or weird date formatting.
- **Maintainability**: avoids repeated fetch logic and reduces effect complexity.
- **Performance**: less redundant network traffic (one fewer challenge fetch during Strava refresh).

### Touched files
- `src/components/Race/RaceView.tsx`

---

## Module 5 — Challenge flows (create/join/my challenges)

### What changed
- **Join flow now actually uses the consent checkbox**:
  - Previously we always sent `challengeDataConsentAccepted: true` even if the user didn’t check the box.
  - Now we require the checkbox and send the real value.
- **Centralized Strava OAuth URL building**:
  - Join now uses `getStravaAuthUrl(returnPath)` instead of manually constructing the URL.
- **Create challenge share link copy is now robust**:
  - Clipboard write is awaited and errors are handled with a toast + log.
- **My Challenges filters now have real types**:
  - Replaced generic `string` filters with narrow unions like `'all' | ChallengeStatus`, reducing bugs and improving autocomplete.

### Why it matters
- **Correctness & compliance**: consent should reflect the user’s action, not a hardcoded `true`.
- **Maintainability**: one OAuth URL builder means fewer subtle encoding/redirect bugs.
- **UX robustness**: clipboard can fail (permissions, insecure context); handling it prevents silent failures.
- **TypeScript maintainability**: typed filters reduce “stringly-typed” code and make refactors safer.

### Touched files
- `src/components/Challenge/JoinChallenge.tsx`
- `src/components/Challenge/CreateChallenge.tsx`
- `src/components/Challenges/MyChallenges.tsx`

---

## Module 6 — Profile + push notifications (UI robustness)

### What changed
- Profile now uses the shared session-token helper instead of manually reading `localStorage` in multiple places.
- Push notification calls now use `API_BASE_URL` (centralized) instead of recomputing the base URL per handler.

### Why it matters
- **Maintainability**: consistent session-token access means fewer “where does auth come from?” surprises.
- **Readability**: less repeated glue code inside UI event handlers.

### Touched files
- `src/components/Profile/Profile.tsx`

