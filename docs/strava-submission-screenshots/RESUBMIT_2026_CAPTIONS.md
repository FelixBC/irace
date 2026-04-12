# Strava resubmission — screenshot captions (April 2026)

Use these **one-line captions under each image** in your PDF. Files were captured against **https://iraceapp.vercel.app** via automated browser, except where noted.

| File | Caption for Strava reviewers |
|------|------------------------------|
| `resubmit-2026-01-race-demo-leaderboard.png` | **Challenge race / leaderboard:** Per-participant distances (km) and progress for the demo challenge; illustrates how Strava-derived activity distances appear only within this challenge. |
| `resubmit-2026-03-create-creator-consent.png` | **Create challenge — acknowledgement:** Creator confirms that invitees will see aggregated challenge progress, not full Strava profiles; links to Privacy Policy. |
| `resubmit-2026-04-profile-strava-connected.png` | **Profile:** Athlete display name, avatar, and “Connected to Strava” state; stats placeholders (distance, activities) reflect synced Strava usage. |
| `resubmit-2026-05-profile-settings-disconnect.png` | **Settings — Strava:** Connection status, link to Strava My Apps, and **Disconnect** (deauthorization path). |
| `08-strava-authorize-scopes.png` *(existing)* | **Strava OAuth — Authorize:** Strava-hosted screen showing the **iRace** app, requested scopes (`read`, `activity:read_all`), and redirect to this app’s callback. **Recapture in your browser if Strava requires a fresher date.** |

**Join-flow consent:** `/join/DEMO123` returned “Challenge not found” on production (demo is API-only). Use `05-join-challenge-consent.png` from an earlier capture, or join a **real** challenge invite and screenshot the consent step.

**OAuth:** Automated session could not complete a fresh Strava login without your credentials. Keep **`08-strava-authorize-scopes.png`** or repeat OAuth in an incognito window and replace.
