#!/usr/bin/env node
/**
 * Strava API compliance checker.
 * Run via: npm run compliance
 * Fails CI (exit 1) if any violation is found.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { globSync } from 'fs';

// ─── polyfill globSync for Node versions that lack it ───────────────────────
let glob;
try {
  ({ globSync: glob } = await import('fs'));
  // fs.globSync was added in Node 22 — fall back to manual walk for older Node
  if (typeof glob !== 'function') throw new Error('not available');
} catch {
  const { readdirSync, statSync } = await import('fs');
  glob = (pattern, opts) => {
    const base = opts?.cwd ?? process.cwd();
    const results = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!['node_modules', 'dist', '.git'].includes(entry.name)) walk(full);
        } else {
          results.push(relative(base, full).replaceAll('\\', '/'));
        }
      }
    };
    walk(base);
    // Basic glob: just return all files (caller filters by extension)
    const ext = pattern.match(/\*\.(\w+)$/)?.[1];
    return ext ? results.filter(f => f.endsWith(`.${ext}`)) : results;
  };
}

const ROOT = process.cwd();
let failures = 0;

function fail(msg) {
  console.error(`\n  ✗ ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}

// ─── 1. Required asset files exist in public/strava/ ─────────────────────────
console.log('\n[1] Strava brand assets in public/strava/');

const REQUIRED_ASSETS = [
  'btn_strava_connect_with_orange.svg',
  'btn_strava_connect_with_white.svg',
  'api_logo_pwrdBy_strava_horiz_orange.svg',
  'api_logo_pwrdBy_strava_horiz_white.svg',
  'api_logo_pwrdBy_strava_horiz_black.svg',
];

for (const filename of REQUIRED_ASSETS) {
  const path = join(ROOT, 'public', 'strava', filename);
  if (existsSync(path)) {
    pass(filename);
  } else {
    fail(`Missing required asset: public/strava/${filename}`);
  }
}

// ─── 2. No ES imports of Strava assets from src/ paths ───────────────────────
console.log('\n[2] No ES imports of Strava assets (must use /strava/ string paths)');

const srcFiles = [];
const walkSrc = (dir) => {
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', 'dist'].includes(entry.name)) {
        walkSrc(full);
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        srcFiles.push(full);
      }
    }
  } catch { /* skip inaccessible dirs */ }
};
walkSrc(join(ROOT, 'src'));

let assetImportViolations = 0;
for (const file of srcFiles) {
  const content = readFileSync(file, 'utf8');
  if (/import\s+\w+\s+from\s+['"][^'"]*strava[^'"]*\.(svg|png|jpg)/i.test(content)) {
    fail(`${relative(ROOT, file)}: Strava asset imported via ES import — use /strava/ string path instead`);
    assetImportViolations++;
  }
}
if (assetImportViolations === 0) pass('No ES imports of Strava asset files found');

// ─── 3. Strava brand img src must use /strava/ prefix ────────────────────────
console.log('\n[3] Strava brand <img> src must use /strava/ prefix');

const STRAVA_IMG_ALTS = [
  /connect with strava/i,
  /powered by strava/i,
  /compatible with strava/i,
];

let badSrcCount = 0;
for (const file of srcFiles) {
  const content = readFileSync(file, 'utf8');
  for (const altPattern of STRAVA_IMG_ALTS) {
    // Find img tags with matching alt text
    const imgRegex = /<img[^>]+>/gi;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      const tag = match[0];
      if (altPattern.test(tag)) {
        // Must have src="/strava/..."
        if (!/src=["']\/strava\//i.test(tag)) {
          fail(`${relative(ROOT, file)}: Strava brand <img> with alt "${altPattern}" has wrong src — must be /strava/...`);
          badSrcCount++;
        }
      }
    }
  }
}
if (badSrcCount === 0) pass('All Strava brand images use /strava/ src prefix');

// ─── 4. Orange hex not used outside allowed files ─────────────────────────────
console.log('\n[4] Strava orange (#FC4C02 / #FC5200) not used as iRace brand color');

const ALLOWED_ORANGE_FILES = [
  'tailwind.config.js',
  'tailwind.config.ts',
  'DESIGN_SYSTEM.md',
  'STRAVA_COMPLIANCE.md',
  // Strava component is allowed to reference the color token name, but not hex
];

const ORANGE_HEX_RE = /#FC4C02|#FC5200|#fc4c02|#fc5200/;

let orangeViolations = 0;
for (const file of srcFiles) {
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  const isAllowed = ALLOWED_ORANGE_FILES.some(a => rel.includes(a));
  if (isAllowed) continue;

  const content = readFileSync(file, 'utf8');
  if (ORANGE_HEX_RE.test(content)) {
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (ORANGE_HEX_RE.test(line)) {
        fail(`${rel}:${i + 1}: Hard-coded Strava orange hex (${line.match(ORANGE_HEX_RE)?.[0]}) — use tailwind token 'strava-orange' or 'brand' instead`);
        orangeViolations++;
      }
    });
  }
}
if (orangeViolations === 0) pass('No raw Strava orange hex literals in component code');

// ─── 5. "Strava" must not appear inside <h1> tags ────────────────────────────
console.log('\n[5] "Strava" must not appear as primary H1 content');

let h1Violations = 0;
for (const file of srcFiles) {
  const content = readFileSync(file, 'utf8');
  // Match JSX h1 elements containing "Strava" as text content (not a comment)
  const h1Re = /<h1[^>]*>[^<]*Strava[^<]*<\/h1>/g;
  let m;
  while ((m = h1Re.exec(content)) !== null) {
    fail(`${relative(ROOT, file)}: "Strava" appears in <h1> — this implies endorsement (${m[0].slice(0, 60)}...)`);
    h1Violations++;
  }
}
if (h1Violations === 0) pass('No "Strava" found in <h1> elements');

// ─── 6. No Strava data passed to AI/ML endpoints ─────────────────────────────
console.log('\n[6] No Strava data passed to AI/ML services');

const AI_ENDPOINT_RE = /openai\.com|anthropic\.com|cohere\.com|huggingface\.co|together\.ai|replicate\.com/i;
const AI_SDK_RE = /from ['"]openai['"]|from ['"]@anthropic-ai|from ['"]cohere-ai/i;

let aiViolations = 0;
for (const file of srcFiles) {
  const content = readFileSync(file, 'utf8');
  if (AI_ENDPOINT_RE.test(content) || AI_SDK_RE.test(content)) {
    // Only flag if this file also handles Strava data
    if (/strava|StravaActivity|stravaTokens|STRAVA_API/i.test(content)) {
      fail(`${relative(ROOT, file)}: File appears to mix Strava data with AI/ML SDK or endpoint — verify Strava data is not passed to AI models`);
      aiViolations++;
    }
  }
}
if (aiViolations === 0) pass('No Strava data / AI endpoint co-location detected');

// ─── 7. Every "Connect with Strava" CTA uses the official asset ───────────────
console.log('\n[7] "Connect with Strava" CTAs use official asset (not custom button)');

let customButtonViolations = 0;
for (const file of srcFiles) {
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  const content = readFileSync(file, 'utf8');

  // Check for buttons/links with "connect strava" text that don't reference the official asset
  const hasConnectStravaText = /connect.*strava|strava.*connect/i.test(content);
  const usesOfficialAsset = /\/strava\/btn_strava_connect_with/i.test(content);
  const isStravaComponent = rel.includes('Strava') || rel.includes('strava');

  if (hasConnectStravaText && !usesOfficialAsset && !isStravaComponent) {
    // Allow if it's just conditional rendering logic, not a visible button
    // Heuristic: look for <button or <a with connect strava text
    if (/<button[^>]*>[\s\S]{0,80}[Cc]onnect[\s\S]{0,20}[Ss]trava[\s\S]{0,80}<\/button>/.test(content) ||
        /<a[^>]*>[\s\S]{0,80}[Cc]onnect[\s\S]{0,20}[Ss]trava[\s\S]{0,80}<\/a>/.test(content)) {
      fail(`${rel}: Renders a "Connect Strava" button without using the official Strava SVG asset`);
      customButtonViolations++;
    }
  }
}
if (customButtonViolations === 0) pass('All Connect-with-Strava CTAs use official asset');

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
if (failures === 0) {
  console.log('✅  All Strava compliance checks passed.\n');
  process.exit(0);
} else {
  console.error(`\n❌  ${failures} compliance violation${failures === 1 ? '' : 's'} found. Fix before committing.\n`);
  process.exit(1);
}
