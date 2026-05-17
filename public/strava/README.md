# Strava Brand Assets

Official Strava developer brand assets. **Do not modify these files.**

## Source

Downloaded from the official Strava developer asset ZIPs:
- `1.1-Connect-with-Strava-Buttons.zip`
- `1.2-Strava-API-Logos.zip`

Available from: https://developers.strava.com/guidelines/

Last downloaded: 2026-05-17

## Files

| File | Purpose | Use when |
|------|---------|----------|
| `btn_strava_connect_with_orange.svg` | OAuth connect button | Light backgrounds |
| `btn_strava_connect_with_orange_x2.svg` | 2x / HiDPI variant | Light backgrounds, retina |
| `btn_strava_connect_with_white.svg` | OAuth connect button | Dark backgrounds |
| `btn_strava_connect_with_white_x2.svg` | 2x / HiDPI variant | Dark backgrounds, retina |
| `api_logo_pwrdBy_strava_horiz_orange.svg` | "Powered by Strava" horizontal | Light backgrounds |
| `api_logo_pwrdBy_strava_horiz_white.svg` | "Powered by Strava" horizontal | Dark backgrounds |
| `api_logo_pwrdBy_strava_horiz_black.svg` | "Powered by Strava" horizontal | Neither of the above |
| `api_logo_pwrdBy_strava_stack_orange.svg` | "Powered by Strava" stacked | Light, space-constrained |
| `api_logo_pwrdBy_strava_stack_white.svg` | "Powered by Strava" stacked | Dark, space-constrained |
| `api_logo_pwrdBy_strava_stack_black.svg` | "Powered by Strava" stacked | Neutral backgrounds |
| `api_logo_cptblWith_strava_horiz_orange.svg` | "Compatible with Strava" horizontal | Light backgrounds |
| `api_logo_cptblWith_strava_horiz_white.svg` | "Compatible with Strava" horizontal | Dark backgrounds |
| `api_logo_cptblWith_strava_horiz_black.svg` | "Compatible with Strava" horizontal | Neutral backgrounds |

## Rules (from Strava Brand Guidelines)

- **Do NOT modify** the SVGs — no recoloring, no resizing the artwork, no layout changes inside the SVG.
- **Do NOT rename** the files — keep Strava's original filenames.
- **Do NOT animate** the lockup or button.
- **Do NOT use** any part of a Strava logo as iRace's app icon.
- **Connect button height:** 48px @1x. Scale the container for layout, but do not squish the button.
- **Color choice:** Use orange on light backgrounds, white on dark backgrounds.
- **Button click** must navigate to `https://www.strava.com/oauth/authorize`.

## Usage in components

Reference via absolute public path (Vite serves `public/` at the root):

```tsx
// Connect with Strava — orange variant (light backgrounds)
<img
  src="/strava/btn_strava_connect_with_orange.svg"
  alt="Connect with Strava"
  height={48}
  className="h-12 w-auto"
/>

// Powered by Strava — horizontal orange (footer, light mode)
<img
  src="/strava/api_logo_pwrdBy_strava_horiz_orange.svg"
  alt="Powered by Strava"
  className="h-6 w-auto"
/>
```

Do NOT use ES imports (`import x from './strava/...'`) — the compliance script will reject them.
