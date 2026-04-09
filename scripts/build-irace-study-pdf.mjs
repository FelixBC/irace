/**
 * Builds a single printable HTML from docs, then prints to PDF via headless Edge.
 * Usage: node scripts/build-irace-study-pdf.mjs
 * Requires: Microsoft Edge (Chromium) at default install path.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const EDGE_CANDIDATES = [
  join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
];

function findEdge() {
  for (const p of EDGE_CANDIDATES) {
    if (existsSync(p)) return p;
  }
  return null;
}

function stripFirstH1(md) {
  return md.replace(/^#\s[^\n]+\n+/, '');
}

function buildCombinedMarkdown() {
  const main = readFileSync(join(root, 'docs', 'REAL_APP_ENGINEERING_GUIDE.md'), 'utf8');
  const audit = stripFirstH1(readFileSync(join(root, 'docs', 'AUDIT_CHANGES.md'), 'utf8'));
  const arch = stripFirstH1(readFileSync(join(root, 'docs', 'ARCHITECTURE.md'), 'utf8'));

  return [
    main.trimEnd(),
    '',
    '---',
    '',
    '# Appendix A — Frontend audit changelog',
    '',
    audit.trim(),
    '',
    '---',
    '',
    '# Appendix B — Architecture notes',
    '',
    arch.trim(),
    '',
  ].join('\n');
}

async function markdownToHtmlFragment(md) {
  const { marked } = await import('marked');
  marked.setOptions({ gfm: true, breaks: false });
  return marked.parse(md);
}

const printCss = `
  @page { size: A4; margin: 18mm 16mm 20mm 16mm; }
  * { box-sizing: border-box; }
  html { font-size: 11pt; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: #1a1a1a;
    line-height: 1.5;
    max-width: 100%;
  }
  .cover {
    page-break-after: always;
    min-height: 90vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    border-bottom: 3px solid #2563eb;
  }
  .cover h1 {
    font-size: 1.85rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.02em;
  }
  .cover .subtitle {
    font-size: 1.05rem;
    color: #444;
    margin: 0 0 2rem 0;
    max-width: 36rem;
    margin-left: auto;
    margin-right: auto;
  }
  .cover .meta {
    font-size: 0.85rem;
    color: #666;
  }
  .content { padding: 0; }
  .content h1 { font-size: 1.35rem; margin-top: 1.75rem; page-break-after: avoid; }
  .content h2 { font-size: 1.15rem; margin-top: 1.35rem; page-break-after: avoid; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.2rem; }
  .content h3 { font-size: 1.02rem; margin-top: 1rem; page-break-after: avoid; }
  .content h4 { font-size: 0.95rem; margin-top: 0.85rem; }
  .content p { margin: 0.5rem 0; orphans: 3; widows: 3; }
  .content ul, .content ol { margin: 0.4rem 0 0.6rem 0; padding-left: 1.35rem; }
  .content li { margin: 0.2rem 0; }
  .content li p { margin: 0.25rem 0; }
  .content hr {
    border: none;
    border-top: 1px solid #d1d5db;
    margin: 1.25rem 0;
  }
  .content code {
    font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
    font-size: 0.88em;
    background: #f3f4f6;
    padding: 0.1em 0.35em;
    border-radius: 3px;
  }
  .content pre {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    overflow-x: auto;
    font-size: 0.82rem;
    page-break-inside: avoid;
  }
  .content pre code { background: none; padding: 0; }
  .content table {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.88rem;
    margin: 0.75rem 0;
    page-break-inside: avoid;
  }
  .content th, .content td {
    border: 1px solid #d1d5db;
    padding: 0.35rem 0.5rem;
    text-align: left;
    vertical-align: top;
  }
  .content th { background: #f9fafb; font-weight: 600; }
  .content blockquote {
    margin: 0.6rem 0;
    padding-left: 0.85rem;
    border-left: 3px solid #93c5fd;
    color: #374151;
  }
  .content strong { font-weight: 600; }
  /* Major sections from --- in MD become hr; appendix titles are h1 */
  .content h1:first-of-type { margin-top: 0; }
`;

async function main() {
  const edge = findEdge();
  if (!edge) {
    console.error('Microsoft Edge (msedge.exe) not found. Install Edge or update EDGE_CANDIDATES in this script.');
    process.exit(1);
  }

  const md = buildCombinedMarkdown();
  const inner = await markdownToHtmlFragment(md);
  const generated = new Date().toISOString().slice(0, 10);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>iRace — study guide (PDF)</title>
  <style>${printCss}</style>
</head>
<body>
  <div class="cover">
    <h1>iRace — engineering &amp; codebase study guide</h1>
    <p class="subtitle">Real-app checklist, how this repo maps to it, audit changelog, and architecture notes — one document for offline study.</p>
    <p class="meta">Generated ${generated} · Source: <code>docs/*.md</code> in the iRace repository</p>
  </div>
  <article class="content">
${inner}
  </article>
</body>
</html>`;

  const htmlPath = join(root, 'docs', '_irace_study_guide_print.html');
  const pdfPath = join(root, 'docs', 'IRACE_STUDY_GUIDE.pdf');

  writeFileSync(htmlPath, html, 'utf8');
  console.log('Wrote', htmlPath);

  const fileUrl = pathToFileURL(htmlPath).href;
  const args = [
    '--headless',
    '--disable-gpu',
    `--print-to-pdf=${pdfPath}`,
    '--no-pdf-header-footer',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=60000',
    fileUrl,
  ];

  execFileSync(edge, args, { stdio: 'inherit' });
  console.log('Wrote', pdfPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
