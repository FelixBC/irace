# Strava developer program — submission pack

Use this when you fill out Strava’s application / review form and when you email reviewers. Copy sections below verbatim or trim to field limits.

**Product display name:** **iRace** (do not use “Strava” in the app name; Strava’s branding guidelines require a distinct product name.)

**Live app (production):** https://iraceapp.vercel.app  

**Legal pages:** https://iraceapp.vercel.app/privacy · https://iraceapp.vercel.app/terms  

**Support email:** set in `VITE_SUPPORT_EMAIL` (shown in footer and Privacy).

---

## 1. One-line product summary (short description field)

> Invite-only group fitness challenges: friends sync Strava activities into shared goals. No public Strava-wide leaderboard; progress is only visible among participants in the same challenge.

---

## 2. What the application does (longer description)

> **iRace** lets a small group run private challenges (running, cycling, etc.) with a shared goal (e.g. distance over a date range). Users sign in with Strava OAuth. We read each athlete’s activities to compute progress toward the challenge goals they joined. Other users only see **aggregated challenge stats** (e.g. distance toward the goal) and **display name / avatar** inside **that** challenge—not their full Strava feed or global rankings across all Strava users.

---

## 3. How this differs from Strava’s own product

> **iRace** does not replicate Strava’s global social graph, segment leaderboards, or Strava’s official Challenges product at platform scale. We are a **narrow, opt-in tool** for **invite-only groups** who already know each other, similar to a private spreadsheet with automatic Strava sync—implemented with explicit consent before joining or creating a challenge.

---

## 4. Scopes requested — and why

**Requested scopes:** `read`, `activity:read_all`

| Scope | Why we need it |
|--------|----------------|
| `read` | Baseline OAuth scope; public profile context as required by Strava’s web OAuth flow. |
| `activity:read_all` | Challenge totals must include activities the athlete has marked **private** or “Only you” in Strava, so in-app progress matches what they see in Strava for the same period. We only use this for users who join or create a challenge and consent; we do not expose their raw private feed to other users—only aggregated metrics inside that challenge. |

If Strava asks you to justify further, add:

> Without `activity:read_all`, a user’s challenge progress would silently disagree with their Strava totals whenever activities are private, which breaks trust in a distance/time-based challenge product.

---

## 5. Data handling (security & compliance)

- **Client secret** is server-only; OAuth token exchange and refresh happen on the server.
- **Deauthorization:** Users can **Disconnect** under Profile → Settings. That calls Strava’s `POST /oauth/deauthorize`, clears stored tokens, and removes synced activity rows we held for that user. Documented in `/privacy`.
- **Consent:** Joining a challenge and creating a challenge require explicit acknowledgements (peer-visible aggregated stats); stored in the database with timestamps/versions.
- **Attribution:** Footer links to Strava and the [Strava API Agreement](https://www.strava.com/legal/api).

---

## 6. Reviewer test plan (paste into “notes” or email)

1. Open https://iraceapp.vercel.app/privacy and confirm contact email and Strava attribution.
2. Click **Connect Strava** (or complete OAuth from join/create flow); authorize the app.
3. **Create challenge:** acknowledge participant visibility; create a challenge and note the invite link.
4. **Second account or incognito:** open invite link, accept consent, join challenge.
5. Open **race** view; confirm you see challenge UI and (if connected) progress behavior.
6. **Profile → Settings → Disconnect:** confirm Strava shows the app removed or tokens cleared; confirm app shows “Not connected” after refresh.
7. Optional: confirm `Authorization Callback Domain` in your Strava app settings is `iraceapp.vercel.app` (hostname only).

---

## 7. Screenshot checklist (attach to submission)

- [ ] Join flow: consent checkbox + link to Privacy.
- [ ] Create flow: creator acknowledgement for peer-visible progress.
- [ ] `/privacy` (full page or above-the-fold + retention/disconnect section).
- [ ] Footer: Strava + API Agreement + support email.
- [ ] Profile → Settings: Strava **Connect** / **Disconnect** (proves deauth path exists).

---

## 8. If they ask about rate limits or caching

> We fetch activities per user when needed for challenge views/sync, not bulk harvesting. We store minimal derived data (e.g. synced activities tied to challenges) and remove per-user synced activities on Strava disconnect.

---

## 9. Internal cross-links

- Implementation checklist: [`STRAVA_REVIEW.md`](./STRAVA_REVIEW.md)  
- DB / Vercel: [`DATABASE_VERCEL.md`](./DATABASE_VERCEL.md)  
- Canonical production hostname: [`VERCEL_DOMAIN.md`](./VERCEL_DOMAIN.md)

This document is guidance only, not legal advice.
