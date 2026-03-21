# Strava submission screenshots

PNG captures for a reviewer packet or for Claude to assemble into a PDF.  
**Production site:** https://iraceapp.vercel.app

## Included

| File | What it shows |
|------|----------------|
| `01-home-fullpage.png` | Landing page + footer (API Agreement, support email, Privacy/Terms). |
| `02-privacy-fullpage.png` | Full Privacy Policy including “Disconnecting Strava” and retention. |
| `03-terms-fullpage.png` | Full Terms including Strava connection section. |
| `04-create-creator-consent-step2.png` | Create challenge **Step 2** with creator acknowledgement checkbox (unchecked). |
| `05-join-challenge-consent.png` | Join flow with participant consent + Privacy link + “Connect Strava & join”. |
| `06-race-demo-challenge-fullpage.png` | Demo race view + leaderboard disclaimer text. |
| `07-strava-oauth-login-step.png` | Strava.com login (start of OAuth after clicking Connect). |
| `08-strava-authorize-scopes.png` | **Strava Authorize** screen (scopes: public profile + private activities). Same as `AuthorizeLogin.png`. |
| `09-profile-settings-strava-connected.png` | Profile → **Settings**: Strava **Connected**, **Disconnect**, link to Strava My Apps. |
| `10-home-logged-in-fullpage.png` | Home while logged in (header shows user, CTAs updated). |
| `11-home-with-production-url-banner.png` | Home viewport with injected **Production URL: https://iraceapp.vercel.app/** bar (substitute for browser chrome URL). |

## Optional manual extras

- Profile → Settings after **Disconnect** (“Not connected”).  
- Strava **Settings → My Apps** with your app listed or removed.

### When the production URL changes

**01–07** and **11** can be re-captured headlessly against `https://iraceapp.vercel.app` (Playwright MCP).  
**08**, **09**, and **10** need a **real browser session**:

- **08** — Log in at **strava.com**, then start OAuth from **iRace** (e.g. join flow → **Connect Strava & join**) and capture the **Authorize** screen (address bar should show `redirect_uri` for `iraceapp.vercel.app`).
- **09** — Log into **iRace**, open **Profile → Settings**, capture while Strava shows **Connected**.
- **10** — Same session: **Home** while logged in.

`AuthorizeLogin.png` is an extra copy of the authorize step; keep `08` and `AuthorizeLogin.png` in sync if you re-shoot **08**.

## For Claude

Zip this folder (or attach all PNGs) and say: *“Merge these images into the PDF using the structure in docs/STRAVA_SUBMISSION.md; use README.md in the screenshots folder for captions.”*
