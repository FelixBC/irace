# Agent / contributor workflow

## Before `git commit` or `git push`

Run the full local check from the repo root:

```bash
npm run verify
```

This runs TypeScript (`typecheck`), ESLint (`lint`), and unit tests (`vitest run`). Fix failures and re-run until it exits cleanly.

Do not commit or push on a failing `verify` unless there is an explicit, documented exception for that change.
