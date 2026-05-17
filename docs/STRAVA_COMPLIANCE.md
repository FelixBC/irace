# Strava Compliance Reference

> Sources: [Brand Guidelines](https://developers.strava.com/guidelines/) (revised Sep 29, 2025),
> [API Agreement](https://www.strava.com/legal/api) (effective Nov 11, 2024),
> [Developer blog update](https://press.strava.com/articles/updates-to-stravas-api-agreement).
> Last audited: 2026-05-17.

---

## Section 1 — Hard Rules (Verbatim + Interpretation)

### R1 — Private-by-Default User Data

**Verbatim (API Agreement):**
> "Strava Data provided by a specific user can only be displayed or disclosed in your Developer
> Application to that user. Strava Data related to other users, even if such data is publicly viewable
> on the Strava Platform, may not be displayed or disclosed."

**Verbatim (Nov 2024 update):**
> "Third-party apps are no longer able to display your Strava activity data on their surfaces to other users."

**Interpretation for iRace:**

| What we show about user B to user A | Allowed? | Reasoning |
|--------------------------------------|----------|-----------|
| Display name + avatar | ✓ | iRace account data, not Strava activity data |
| Aggregated % toward challenge goal (e.g. "47%") | ✓ | iRace-computed score derived from consent-scoped progress |
| Rank / finish position | ✓ | iRace-derived ranking |
| Total km toward challenge goal (aggregate) | ✓ | iRace metric — not a raw Strava activity |
| Individual activity titles | ✗ | Raw Strava activity data |
| Per-activity distance or pace | ✗ | Raw Strava activity data |
| Heart rate (per activity or average) | ✗ | Raw Strava activity data |
| Elevation (per activity) | ✗ | Raw Strava activity data |
| Individual activity timestamps | ✗ | Raw Strava activity data |
| Activity map / route | ✗ | Raw Strava activity data |
| Kudos count | ✗ | Raw Strava activity data |

**Self-data:** A user may view full detail of their OWN activities. There is no restriction on
what the authenticated user sees about themselves.

---

### R2 — No AI/ML Training on Strava Data

**Verbatim (API Agreement):**
> "You may not use the Strava API Materials (including Strava Data), directly or indirectly, for any
> model training related to artificial intelligence, machine learning or similar applications."

**Verbatim (Nov 2024 update):**
> "Third parties from using any data obtained via Strava's API in artificial intelligence models or
> similar applications."

**Interpretation:** No Strava activity data (fetched via API or stored in our DB) may be passed to
any LLM, embedding model, or ML pipeline. This applies even to "anonymized" or "aggregated" subsets.

**Required code annotation:** Any code path that touches Strava data must carry:
```ts
// Strava API Agreement: do not pass this data to AI/ML models.
```

---

### R3 — Distinct Look and Feel from Strava

**Verbatim (API Agreement):**
> "You cannot create an application that, in Strava's sole discretion, imitates the look, imagery,
> and brand identity of Strava and the Strava Platform."

**Verbatim (Nov 2024 update):**
> "Third-party apps must maintain designs that 'complement Strava's distinctive look and feel, rather
> than replicating it' to help users distinguish between Strava and third-party platforms."

**Interpretation:**
- Strava's distinctive palette is orange (`#FC4C02` / `#FC5200`) combined with dark grays and white.
- iRace must use a clearly different primary brand color for UI chrome, buttons, accents, hero sections.
- Orange is only permitted where the Brand Guidelines specifically require it: the official
  "Connect with Strava" button, "Powered by Strava"/"Compatible with Strava" lockups,
  and "View on Strava" text links.

---

### R4 — Logo and Attribution Rules

**Verbatim (Brand Guidelines):**
> "All apps that choose to use the Connect with Strava button for OAuth must link to" the OAuth
> endpoint. Available in "2 color options: orange and white." Button height: "48px @1x, 96px @2x."

> "Never use Strava logos in any manner that implies your application was developed or sponsored by
> Strava."
> "Never use any part of a Strava logo as the icon for your application."
> "Never modify, alter or animate Strava logos."

> When linking to Strava data, use exact text: **"View on Strava"**
> "Text link should be legible" and identified via "bold weight, underline, or orange color #FC5200."

> "You must not use the Strava name in your application name."
> "should not appear more prominently than" your application name/logo.

> Approved phrases: "Powered by Strava" or "Compatible with Strava."

**Interpretation:**
1. The OAuth button must use the official Strava asset (from the developer downloads), not a
   custom-styled button.
2. The Strava name in our own product copy must not be rendered in a font size larger than the
   surrounding text or in a style that implies endorsement.
3. All links to individual Strava activity pages must use exactly the text "View on Strava".
4. The official "Powered by Strava" image must appear in the footer (or another prominent location)
   to attribute data provenance.
5. "iRace" must be the clearly primary brand identity in all screens.

---

### R5 — User Consent Before Data Access

**Verbatim (API Agreement):**
> "Strava users must expressly authorize your Developer Applications prior to you accessing any of
> their data." Applications "must obtain the legal consent of a Strava user before accessing any of
> their data."
> At minimum outline: "what type of data will be collected; how the data will be collected; how a
> user can withdraw their consent; how a user may request deletion."

**Interpretation:** Before redirecting to Strava OAuth, we must show the user a clear pre-consent
screen that lists the scopes we request and what we use them for. We currently do this via the
checkbox in create/join flows. Verify the pre-OAuth screen in the join flow is shown before the
redirect.

---

### R6 — App Identity (Logo / Favicon / OG Image)

**Verbatim (Brand Guidelines):**
> "Never use any part of a Strava logo as the icon for your application."

**Interpretation:** The iRace app icon, favicon, and OG image must not contain or resemble the
Strava logo, and must not use Strava's primary orange as the dominant color in the icon (since the
icon represents the app's identity and using Strava's color there implies affiliation).

---

### R7 — Data Retention and Deletion

**Verbatim (API Agreement):**
> "No Strava Data shall remain in your cache longer than seven days."
> "You may not continue displaying or disclosing Strava Data in your Developer Application that a
> user has deleted from Strava... within 48 hours."
> Upon revocation: "you must ensure that all Personal Data pertaining to that user is deleted from
> your Developer Applications and related networks, systems and servers."

**Interpretation (backend concern, not frontend):**
- Activities synced into our DB must be re-validated within 7 days; deleted activities must be
  removed within 48 hours.
- On Strava disconnect (`POST /api/strava/disconnect`), all Strava-sourced Activity rows for that
  user must be deleted immediately, not just the token.

---

### R8 — Competitive Use Prohibition

**Verbatim (API Agreement):**
> "You may not use Strava API Materials in any manner that is competitive to Strava or the Strava
> Platform."

**Interpretation:** iRace is a challenge/race platform, not a general activity tracking/recording
app. We do not reproduce the Strava feed, segment leaderboards, club functionality, or explore
features. We use Strava data as a data source for user-controlled challenges — this is consistent
with the permitted "coaching platforms focused on providing feedback to users."

---

## Section 2 — Reviewer Checklist

A Strava API reviewer walking through the app would check these items. Current status noted.

### Connect with Strava OAuth Button
- [ ] Uses official Strava asset (orange or white variant from developer downloads)
- [ ] Height ≥ 48px
- [ ] Links to `https://www.strava.com/oauth/authorize`
- [ ] Not modified, recolored, or animated
- **Current status**: FAIL — all screens use custom-styled orange buttons

### Powered by Strava Lockup
- [ ] Official asset used (orange/white/black from developer downloads)
- [ ] Appears in app footer or prominent location
- [ ] Not modified, recolored, or animated
- **Current status**: FAIL — no lockup present

### "Not affiliated with Strava" Disclosure
- [ ] Appears in app footer on every page
- [ ] Uses language like "Not affiliated with or endorsed by Strava, Inc."
- **Current status**: PARTIAL — present in JoinChallenge only; missing from global Footer

### "View on Strava" Links
- [ ] All links to individual Strava activities use exact text "View on Strava"
- [ ] Styled bold, underlined, or in `#FC5200`
- **Current status**: N/A — no activity links rendered for other users (compliant)

### Data Display — Other Users (R1)
- [ ] No other user's individual activity details (title, distance, pace, HR, elevation, timestamp) are visible to anyone except that user
- [ ] Opponent views show only: name, avatar, aggregated %, rank
- **Current status**: MOSTLY PASS — Leaderboard shows only aggregate %. ActivityFeed in production shows only the current user's own activities. Demo mode shows fake multi-user activities with distance/duration (not real Strava data, but the pattern is architecturally wrong)

### Results Panel (Race View)
- [ ] Final results for other participants show only name, avatar, rank, and aggregate total
- [ ] No per-activity breakdown for others
- **Current status**: PASS — shows `finalDistance` (aggregate challenge total), not per-activity detail

### Distinct Brand Identity (R3)
- [ ] iRace primary color is not Strava orange (#FC4C02 / #FC5200)
- [ ] Orange is used ONLY on Strava-branded UI elements
- [ ] App does not generally feel like a Strava clone
- **Current status**: FAIL — orange-500 / orange-600 is iRace's primary brand color throughout

### App Name and Trademark Usage
- [ ] "Strava" does not appear in app name or page titles
- [ ] "Strava" in text is not styled larger or more prominently than iRace branding
- **Current status**: PARTIAL — "iRace" is the app name (pass); landing page hero shows "Real Strava Data" as gradient-styled primary value prop with Strava appearing in the same decorative gradient as iRace's own name (risk)

### Consent Screens
- [ ] Pre-OAuth consent screen shown before Strava redirect listing scopes and purpose
- [ ] User can see how to withdraw consent (link to Strava settings)
- [ ] User can see how to delete their data
- **Current status**: PASS — create and join flows both have consent checkboxes with Privacy Policy links

### Privacy Policy
- [ ] Documents what Strava data is collected and why
- [ ] Documents that only connected user's data is read
- [ ] Documents that other users' Strava activity data is not shown to third parties
- [ ] Documents no AI/ML use of Strava data
- [ ] Documents data deletion on disconnect
- **Current status**: Needs verification against R2 and updated R1 language

---

## Section 3 — Known Risks in iRace Today and Resolutions

### RISK-1 (CRITICAL): ActivityFeed Component Architecture — R1

**File:** `src/components/Race/ActivityFeed.tsx`
**Lines:** 33–229

**Problem:** The `ActivityFeed` component accepts `users: User[]` (multiple users) and maps
activities to each user, rendering per-activity HR, elevation, distance, and duration for each
person. The component is architecturally designed to show multiple users' individual activity data.

**Current production data flow:** In non-demo mode, `RaceView.tsx` passes only the current user's
own data (`stravaData.user` = single user, `stravaData.activities` = their own activities). So
the PRODUCTION data flow is compliant today.

**Demo mode risk:** The demo feed (`getDemoActivityFeed()` in RaceView.tsx:57-112) creates 3 fake
users with fake per-activity distance and duration. These are not real Strava data, so R1 does not
technically apply. However, it demonstrates a pattern that would be non-compliant in production, and
a future developer could inadvertently feed real multi-user data to this component.

**Resolution:**
- Rename `ActivityFeed` to `MyRecentActivities` and remove the `users: User[]` prop entirely
- The component renders only the signed-in user's own activities (passed directly)
- Remove HR, elevation, and distance rendering for other participants from all views
- Update demo mode to show only one simulated "you" user's activities
- This eliminates both the production risk and the architecturally-wrong pattern

### RISK-2 (HIGH): Strava Orange as iRace Primary Color — R3

**Files affected:** Every component file in `src/components/`

**Problem:** `orange-500` / `orange-600` is used as the iRace primary UI color for buttons, CTAs,
focus rings, selected states, hero gradients, and interactive elements. This creates an app that
visually reads as "Strava-branded."

**Resolution:**
- Define a new iRace brand color (Electric Blue `#2563EB`) as semantic token `brand` in tailwind.config.js
- Replace all non-Strava uses of orange with `brand` color
- Reserve `orange-500` / `#FC5200` exclusively for: official Connect with Strava button, Powered by
  Strava lockup, View on Strava links
- This is a sweeping visual change that must be done before resubmission

### RISK-3 (HIGH): Missing Official Strava Button Assets — R4

**Files affected:** `src/components/Strava/StravaConnect.tsx`, `src/components/Home/LandingPage.tsx`,
`src/components/Challenge/JoinChallenge.tsx`, `src/components/Layout/Header.tsx`

**Problem:** Every "Connect Strava" button is a custom-styled HTML button. The Brand Guidelines
require using the official Strava asset.

**Resolution:**
- Download official assets from the Strava developer downloads
- Place under `public/strava/btn-connect-with-strava-orange.svg` and `…-white.svg`
- Replace custom buttons with `<img>` elements at the specified 48px height
- The button must link to `https://www.strava.com/oauth/authorize` (or our OAuth redirect)

### RISK-4 (MEDIUM): Missing "Powered by Strava" Footer Lockup — R4

**File:** `src/components/Layout/Footer.tsx`

**Problem:** The footer links to Strava and cites the API Agreement but does not display the
official "Powered by Strava" image asset.

**Resolution:**
- Download official asset from Strava developer downloads
- Add to footer with correct dimensions (use SVG/PNG, do not modify color or proportions)
- Remove the current plain-text Strava link (which uses orange color but isn't a data link)

### RISK-5 (MEDIUM): "Not affiliated" Disclosure Incomplete — R4

**File:** `src/components/Layout/Footer.tsx`

**Problem:** The JoinChallenge screen has "This app uses the Strava API but is not endorsed by
Strava" but the global Footer does not. Every page must carry this disclosure.

**Resolution:**
- Add to Footer: "iRace is not affiliated with or endorsed by Strava, Inc. Strava® is a registered trademark of Strava, Inc."

### RISK-6 (LOW): Landing Hero "Real Strava Data" Copy — R3/R4

**File:** `src/components/Home/LandingPage.tsx` line 31

**Problem:** The H1 renders "Race Your Friends with Real Strava Data" with "Real Strava Data"
in a large decorative orange-to-red gradient. This places "Strava" in the app's primary hero
statement styled in a way that emphasizes Strava over iRace.

**Resolution:**
- Reframe copy to foreground iRace's value prop: e.g., "Race Your Friends. Track Real Progress."
- Strava attribution moves to a smaller "Powered by Strava" element with the official lockup
- The hero gradient changes from orange-red (Strava palette) to iRace's brand blue

### RISK-7 (LOW): RaceView Hero Gradient — R3

**File:** `src/components/Race/RaceView.tsx` line 439

**Problem:** `from-orange-500 to-red-600` is the race view hero background — identical to Strava's
brand palette.

**Resolution:** Change to iRace brand blue gradient.

### RISK-8 (LOW): JoinChallenge Orange Header Gradient — R3

**File:** `src/components/Challenge/JoinChallenge.tsx` line 169

**Problem:** `from-orange-500 to-red-500` header banner.

**Resolution:** Change to brand blue.

### RISK-9 (BACKEND — DO NOT FIX IN THIS PR): 7-Day Cache Limit — R7

**Concern:** The API agreement requires Strava data not remain in cache beyond 7 days. Verify that
the DB migration or cron job re-validates / purges Activity rows older than 7 days. If no such job
exists, create a `POST /api/cron/strava-cleanup` endpoint and wire it to a Vercel cron.

**Resolution:** Backend pass — document and track as a separate PR.

### RISK-10 (BACKEND — DO NOT FIX IN THIS PR): 48-Hour Deletion on Strava-Side Delete — R7

**Concern:** Per the agreement, if a user deletes an activity on Strava, we must remove it from
our DB within 48 hours. This likely requires a Strava webhook subscription (push notifications for
activity events). Verify webhook handler exists in `api/`.

**Resolution:** Backend pass — document and track.

### RISK-11 (BACKEND — DO NOT FIX IN THIS PR): AI/ML Comment Annotation — R2

**Concern:** `server/` and `api/` code paths that read or store Strava data should carry the R2
comment. This is a backend pass.

**Resolution:** In the compliance script (`scripts/check-strava-compliance.mjs`), add a grep for
Strava API call sites that are missing the R2 comment. Flag in CI.

---

## Compliance Decision: Community App vs Standard App

The API Agreement distinguishes "Community Applications" (≤9,999 users) created primarily to
"permit athletes to organize and collaborate in group activities" — these may have different data
sharing rules. iRace is designed exactly for this purpose (invite-only group fitness challenges).

**However:** The Nov 2024 press update and community hub post make **no mention** of a community
app exception, suggesting Strava is applying the data display restriction uniformly. We cannot rely
on the community app carve-out for our production review.

**Our safe position:** Limit what we show about others to name + avatar + aggregated challenge
progress (%, rank, total km toward goal). This satisfies even the stricter reading of the rule
and is the most defensible position for API review.

---

*This document is internal guidance. For legal questions, consult qualified counsel.*

---

## Section 4 — Profile Page Backend Follow-Ups (PR3)

The `/profile` page displays real data where available and skeleton placeholders where backend
endpoints do not yet exist. The table below tracks all gaps.

| ID | Field(s) | Why skeleton | Backend work needed |
|----|----------|--------------|---------------------|
| PF-1 | `currentStreak`, `longestStreak`, `hoursUntilLost` | No streak endpoint | Aggregate Activity rows by userId over consecutive days |
| PF-2 | `weeklyDistance`, `weeklyDistanceDelta` | No weekly stats endpoint | Sum Activity.distance for current and prior calendar week |
| PF-3 | `wins`, `losses`, `winRate` | `finishPosition` missing from list endpoint | Return `participants` as array (not count) in `GET /api/challenges?userId=...`; include `finishPosition` |
| PF-4 | `longestActivityKm`, `fastestPaceSecPerKm`, `biggestElevationGainM` | No PB endpoint | Aggregate queries over Activity table per user |
| PF-5 | `HeatmapCell[] (date, distance, count)` | No heatmap endpoint | New `GET /api/users/:id/heatmap?range=12wk\|6mo\|1yr` — daily aggregated distance + count |
| PF-6 | `totalDistanceKm`, `totalTimeSeconds`, `totalActivities`, `totalElevationM`, `sportBreakdown` | No lifetime stats endpoint | Aggregate queries over Activity table per user |
| PF-7 | `HeadToHeadRecord[] (userId, name, image, wins, losses)` | No H2H endpoint | Cross-challenge aggregation tracking finish positions per opponent pair |
| PF-8 | `user.createdAt` | Not in User type | Return `createdAt` from session endpoint; add `createdAt?: string` to `User` interface |

### What is explicitly NOT shown on the Profile page (R1 compliance)

| Data not shown | Reason |
|----------------|--------|
| Global iRace leaderboard across all users | Exposes aggregate data of other users outside a challenge context |
| "Top X% on Strava" claims | Requires platform-wide Strava data comparison |
| Friends' activity feed on the profile | Would show other users' Strava activity data (R1 violation) |
| AI-generated insights from Strava data | Prohibited by R2 |
| Maps, route lines, GPS coordinates | Raw per-activity geographic data |
| Other users' raw activity metrics (distance, pace, HR, elevation) | R1 violation |
| Opponent per-activity detail anywhere in head-to-head view | R1 violation — only iRace-derived rank (W/L count) is shown |
