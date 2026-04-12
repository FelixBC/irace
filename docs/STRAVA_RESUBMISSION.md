# Strava Developer Program — resubmission (use case + screenshots)

Use this when Strava asks for **more detail on your use case** and **images of every place Strava data appears**. Keep the PDF **short**: only screens where **Strava-sourced or Strava-derived data** is visible. Skip generic pages (home marketing, full Privacy/Terms) unless they explicitly ask.

**Production app:** https://iraceapp.vercel.app  

---

## 1. What to paste in the “use case” / description field

You can adapt this (keep it factual and specific):

> **iRace** is an invite-only group fitness app. Users connect with **Strava OAuth** (`read`, `activity:read_all`). We use Strava **activities** (distance/time within the challenge window, sport type) to compute **per-user progress** toward a **shared challenge goal** among people who joined the same invite link. We display **Strava-derived metrics** (e.g. kilometres toward the goal) on a **challenge race / leaderboard** view. We show the athlete’s **Strava profile name and avatar** in the app header/profile when connected. **We do not** show a user’s full Strava activity feed to other users; only **aggregated challenge stats** and **identity** inside that challenge, after **explicit consent** on join/create. Users can **disconnect** Strava in Settings; we honor deauthorization per our Privacy Policy.

If there is a character limit, shorten to the first two sentences + consent + disconnect.

---

## 2. Minimal screenshot set (each must show Strava data clearly)

| # | Screen | What Strava data must be **visible** | Suggested capture |
|---|--------|----------------------------------------|-------------------|
| A | **OAuth — Authorize** | Strava UI showing app name **iRace**, requested **scopes** (`read`, `activity:read_all`), redirect to your production domain | Start OAuth from iRace (e.g. Profile or Join → Connect Strava); capture Strava’s authorize page |
| B | **Profile / account** | **Connected to Strava**, athlete **name** + **avatar** from Strava, or equivalent | `Profile` while connected |
| C | **Settings / Strava** | **Disconnect**, link to manage app, connection state | Same page or dedicated settings block |
| D | **Race / leaderboard** | **km** (or progress) **from synced Strava activities**, multiple participants if possible | Open a challenge race view where distances are **not** all zeros |
| E | **Join (or create) consent** | Copy that states **Strava** / **activities** / **aggregated** visibility | Join flow consent step |

**Tip:** Strava rejected packs that buried these behind long Privacy/Terms screenshots. Lead with **D + B** if you only have room for a few images.

---

## 3. Caption text (put **under each image** in your PDF)

Use a short title + one sentence. Example:

1. **Strava OAuth — authorize**  
   *Shows the Strava authorization screen for the iRace app, including requested API scopes used only after the user connects.*

2. **Profile — Strava connection**  
   *Shows the athlete display name and profile image supplied by Strava, and the in-app “Connected to Strava” state.*

3. **Settings — Strava connection**  
   *Shows where the user can disconnect Strava and manage the integration.*

4. **Challenge race / leaderboard**  
   *Shows per-participant distance (km) derived from Strava activities synced for this challenge window; used only among participants in this invite.*

5. **Join challenge — consent**  
   *Shows explicit user acknowledgement before Strava data is used for challenge progress visible to other participants.*

---

## 4. Fresh captures checklist (before you export the PDF)

- [ ] Leaderboard (**D**) has **real non-zero km** (demo challenge or a real challenge with synced activities).
- [ ] Profile (**B**) shows **green / connected** and **your** Strava name + avatar.
- [ ] Authorize (**A**) shows **current** app name and **scopes** (not an old build).
- [ ] Optional: crop browser chrome or add a small text label “Production: iraceapp.vercel.app” if the URL bar is not visible.

Place final PNGs in `docs/strava-submission-screenshots/` (you can name them `resubmit-01-oauth.png`, etc.) and keep this file updated if filenames change.

---

## 5. Exporting the PDF

- Assemble images + captions in **Word**, **Google Docs**, **Keynote**, or **Figma**, then **Export / Print to PDF**.
- Or use any “combine images to PDF” tool; keep page order: **use case text first** (optional) **or** captions-only under each image.

---

## 6. Related docs

- Broader submission copy: [`STRAVA_SUBMISSION.md`](./STRAVA_SUBMISSION.md)  
- Screenshot inventory (older full set): [`strava-submission-screenshots/README.md`](./strava-submission-screenshots/README.md)
