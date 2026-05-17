# iRace Design System

> Applies to the full frontend (`src/`). All hex values are defined here and wired into
> `tailwind.config.js` as semantic tokens — **no hex literals in component code**.
> Last updated: 2026-05-17.

---

## 1 — Brand Identity

iRace is a **competitive fitness challenge platform**, not a fitness tracker. The visual identity
should communicate:
- **Speed and competition** — dynamic, directional, energetic
- **Friendly intensity** — competitive but not intimidating; invite-based, small-group
- **Trustworthy data** — real athlete data backing every race; precision over decoration
- **Distinctly iRace** — not Strava, not a generic SaaS dashboard

**The single signature visual treatment:** a subtle animated diagonal gradient flowing from
`brand-dark` to `brand` (deep to electric blue), used in the hero sections of Landing and Race views.
CSS-only, GPU-cheap, consistent across the app.

---

## 2 — Color Palette

### 2.1 iRace Brand Colors

| Token | Tailwind Class | Hex | Usage |
|-------|----------------|-----|-------|
| `brand` | `bg-brand` / `text-brand` | `#2563EB` | Primary buttons, focus rings, active nav, selected states |
| `brand-hover` | `bg-brand-hover` | `#1D4ED8` | Button hover states |
| `brand-light` | `bg-brand-light` | `#3B82F6` | Lighter brand accents, sparklines |
| `brand-faint` | `bg-brand-faint` | `#EFF6FF` | Light-mode selected backgrounds, chip backgrounds |
| `brand-dark` | `bg-brand-dark` | `#1E40AF` | Hero gradient start, dark mode emphasis |

**Selection rationale:** Electric blue (`#2563EB`) reads as velocity (motorsport, competitive
swimming, running tracks), is clearly distinct from Strava orange, provides 4.5:1+ contrast on
white, and aligns with iRace's "precision competition" positioning.

### 2.2 Strava-Reserved Colors (NEVER use for iRace UI)

| Token | Hex | Permitted uses ONLY |
|-------|-----|---------------------|
| `strava-orange` | `#FC5200` | Official "Connect with Strava" button, "Powered by Strava" lockup, "View on Strava" text links |
| (internal) | `#FC4C02` | Same as above only |

> **Rule:** Any orange element that is NOT one of the three Strava-branded purposes above
> must be migrated to `brand` blue. The CI compliance script enforces this.

### 2.3 Semantic Surface Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `surface-1` | `#FFFFFF` | `#111827` | Page background |
| `surface-2` | `#F9FAFB` | `#1F2937` | Card backgrounds, panels |
| `surface-3` | `#F3F4F6` | `#374151` | Hover backgrounds, subtle dividers |
| `surface-border` | `#E5E7EB` | `#374151` | Card borders |

These map to Tailwind's existing `gray-*` scale — no new tokens needed for these, use the
Tailwind classes directly (`bg-gray-50`, `dark:bg-gray-800`, etc.).

### 2.4 Semantic Status Colors

| Token | Tailwind | Usage |
|-------|----------|-------|
| `success` | `green-600` / `dark:green-400` | Completed challenges, Strava connected, wins |
| `danger` | `red-600` / `dark:red-400` | Errors, disconnect, lost challenges |
| `warning` | `amber-500` / `dark:amber-400` | Expiring challenges, incomplete state |
| `info` | `sky-500` / `dark:sky-400` | Informational, neutral stats |

### 2.5 Sport Accent Colors

These are fixed identity colors for sport types — not brand colors, but consistent across all views:

| Sport | Primary | Background (light) | Background (dark) |
|-------|---------|--------------------|--------------------|
| Running | `orange-500` | `orange-50` | `orange-950/40` |
| Cycling | `blue-500` | `blue-50` | `blue-950/40` |
| Swimming | `teal-500` | `teal-50` | `teal-950/40` |
| Walking | `green-500` | `green-50` | `green-950/40` |
| Hiking | `amber-500` | `amber-50` | `amber-950/40` |
| Weight Training | `purple-500` | `purple-50` | `purple-950/40` |
| Yoga | `indigo-500` | `indigo-50` | `indigo-950/40` |

> Sport colors can use orange for Running — this is a sport category color (like a race bib color),
> not the iRace brand color. The distinction must be visually clear (sport chip/badge context).

---

## 3 — Typography

Font stack is already configured in `tailwind.config.js`:
- **Sans:** `Inter` → `system-ui` → `sans-serif`
- **Mono:** `JetBrains Mono` → `monospace` (for numeric data displays)

### 3.1 Type Scale

| Role | Class | Size | Weight | Usage |
|------|-------|------|--------|-------|
| Display | `text-5xl md:text-6xl font-bold` | 48–60px | 700 | Landing hero H1 |
| Title | `text-3xl font-bold` | 30px | 700 | Page titles, race name |
| Heading | `text-xl font-semibold` | 20px | 600 | Section headings |
| Subheading | `text-lg font-semibold` | 18px | 600 | Card headings |
| Body | `text-base` | 16px | 400 | Default body text |
| Small | `text-sm` | 14px | 400 | Supporting text, labels |
| Micro | `text-xs` | 12px | 400 | Timestamps, metadata |
| Stat | `text-2xl font-bold tabular-nums` | 24px | 700 | Numeric stat displays |
| Stat-lg | `text-4xl font-bold tabular-nums` | 36px | 700 | Hero stat count-ups |

### 3.2 Numeric Displays

Every numeric display that animates, updates, or shows ranked data **must** use:
```css
font-variant-numeric: tabular-nums;
```
In Tailwind: `tabular-nums` utility class. Apply to: stat cards, leaderboard distances, heatmap
counts, streak numbers, countdown timers.

---

## 4 — Spacing and Layout

**Max content width:** `max-w-7xl` (1280px) with `px-4 sm:px-6 lg:px-8` gutters — keep existing.

**Card padding:** `p-6` (24px) for standard cards, `p-4` (16px) for compact rows.

**Grid systems:**
- Stats row: `grid-cols-2 sm:grid-cols-4` (hero stat row — 2×2 on mobile, 4-up on sm+)
- Bento cards: `grid-cols-1 sm:grid-cols-3` (streaks/PBs section)
- Content sidebar: `grid-cols-1 lg:grid-cols-3` (race view — existing pattern)

**Touch targets:** Minimum `44×44px` for all interactive elements. Verify on mobile.

---

## 5 — Motion Principles

Using Framer Motion. All animations must respect `useReducedMotion()` — skip transforms and opacity
fades when the user prefers reduced motion.

### 5.1 Duration Scale

| Name | Duration | Usage |
|------|----------|-------|
| Instant | 0ms | Skeleton → content swap (no animation needed) |
| Micro | 150ms | Button tap feedback, toggle flips |
| Standard | 250ms | Card entry, fade-in |
| Emphasis | 400ms | Hero section entry |
| Count-up | 800–1000ms | Numeric stat animations |

### 5.2 Standard Animations

**Page/section entry:**
```ts
initial={{ opacity: 0, y: 16 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.25, ease: 'easeOut' }}
```

**Stat count-up (hero):**
```ts
// useCountUp hook: animates from 0 to target over 900ms ease-out
// Skip if useReducedMotion() returns true
```

**Card hover:**
```ts
whileHover={{ scale: 1.02 }}
transition={{ type: 'spring', stiffness: 400, damping: 20 }}
```

**Button tap:**
```ts
whileTap={{ scale: 0.97 }}
```

**Rank change (leaderboard):**
```ts
layout  // Framer Motion layout prop only — no custom transition
```

### 5.3 Signature Animated Background

For hero sections (Landing, Race, Profile) — a subtle CSS gradient animation, no JS required:

```css
@keyframes gradient-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.hero-bg {
  background: linear-gradient(135deg, #1E40AF, #2563EB, #3B82F6, #1E40AF);
  background-size: 300% 300%;
  animation: gradient-shift 8s ease infinite;
}
```

Pause animation when `prefers-reduced-motion: reduce` is set:
```css
@media (prefers-reduced-motion: reduce) {
  .hero-bg { animation: none; background-position: 0% 50%; }
}
```

---

## 6 — Component Recipes

### 6.1 Primary Button (iRace brand)

```tsx
<motion.button
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
  className="bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-3 rounded-xl
             transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2
             dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
>
  Label
</motion.button>
```

### 6.2 Strava Connect Button (official asset)

```tsx
<a href={stravaOAuthUrl} className="inline-block focus:outline-none focus:ring-2 focus:ring-strava-orange focus:ring-offset-2">
  <img
    src="/strava/btn-connect-with-strava-orange.svg"
    alt="Connect with Strava"
    height={48}
    className="h-12 w-auto"
  />
</a>
```

### 6.3 Stat Card

```tsx
<div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
  <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white mt-1">{value}</p>
  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sublabel}</p>
</div>
```

### 6.4 Skeleton State

Match the shape of the final content. Use `animate-pulse`:
```tsx
<div className="animate-pulse space-y-3">
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
</div>
```

### 6.5 Empty State

Every section that can be empty must show:
```tsx
<div className="text-center py-12">
  <Icon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
  <p className="text-base font-medium text-gray-700 dark:text-gray-300">{title}</p>
  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
  <PrimaryButton className="mt-6">{cta}</PrimaryButton>
</div>
```

### 6.6 "View on Strava" Link

```tsx
<a
  href={stravaActivityUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="font-bold underline text-strava-orange hover:opacity-80 transition-opacity text-sm"
>
  View on Strava
</a>
```

Exact text. Bold and underlined. Strava orange color (`#FC5200`). No other styling.

### 6.7 Focus Rings

All interactive elements: `focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-gray-900`

For Strava elements: `focus:ring-strava-orange`.

---

## 7 — Accessibility Standards

- **Contrast:** All text must meet WCAG AA (4.5:1 for normal text, 3:1 for large text). Brand
  blue `#2563EB` on white: 4.6:1 ✓. Brand blue on `gray-50`: 4.4:1 — use `brand-dark` for text
  on light backgrounds if needed.
- **Focus rings:** Always visible (never `outline-none` without `focus:ring-*`).
- **Color-only signals:** Never use color as the sole differentiator. Pair with icon, label, or
  shape (e.g., win status = green icon + "Won" text, not green color alone).
- **Touch targets:** 44×44px minimum for all tap targets.
- **Icon alt text:** Decorative icons use `aria-hidden="true"`. Functional icon-only buttons need
  `aria-label`.
- **Motion:** `useReducedMotion()` from Framer Motion must gate all transforms and opacity
  animations. Static alternatives are shown when reduced motion is preferred.

---

## 8 — Dark Mode Rules

- Use Tailwind `dark:` variants throughout — never hard-coded hex in components.
- `bg-white dark:bg-gray-900` for cards.
- `bg-gray-50 dark:bg-gray-950` for page backgrounds.
- `text-gray-900 dark:text-white` for primary text.
- `text-gray-600 dark:text-gray-300` for secondary text.
- `text-gray-400 dark:text-gray-500` for placeholder/disabled text.
- `border-gray-200 dark:border-gray-700` for card borders.
- Brand blue works in both modes without adjustment — use the same `bg-brand` class.

---

## 9 — Tailwind Config Changes Required

```js
// tailwind.config.js — additions to theme.extend.colors
colors: {
  // iRace brand — primary UI color (not Strava orange)
  'brand': {
    DEFAULT: '#2563EB',
    hover: '#1D4ED8',
    light: '#3B82F6',
    faint: '#EFF6FF',
    dark: '#1E40AF',
  },
  // Strava elements ONLY — connect button, Powered by lockup, View on Strava links
  'strava-orange': '#FC5200',
  // Existing colors kept for backward compat during migration
  'strava-orange-legacy': '#FC4C02',
}
```

During the color migration, every `orange-500` / `orange-600` instance in component code that
is NOT a Strava-branded element must be replaced with `brand` / `brand-hover`. The CI compliance
script (Step 6) catches regressions.

---

## 10 — Performance Constraints

- **Below-the-fold sections** (heatmap, challenge timeline, recent activities in profile): wrapped
  in `React.lazy` + `Suspense` with a skeleton fallback.
- **Hero must paint without data:** Show skeleton immediately; hydrate with real data after fetch.
- **No chart libraries** for heatmap or sparklines — pure CSS grid + Tailwind cells.
- **No WebGL/canvas** for animated backgrounds — CSS `animation` only.
- **Images:** All avatar images use `loading="lazy"` except the current user's avatar in the hero.
