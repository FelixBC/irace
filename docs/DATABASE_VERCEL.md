# Database on Vercel (Neon Postgres)

**Vercel’s own “Postgres” product was retired.** New projects use the **Marketplace** (commonly **[Neon](https://neon.tech/)**).

## What was done for this project

- Neon was installed with: `vercel integration add neon` (region `iad1`).
- Vercel injects **`DATABASE_URL`** (pooled) and **`DATABASE_URL_UNPOOLED`** (direct) for Production and Preview.
- Prisma is configured with `directUrl = env("DATABASE_URL_UNPOOLED")` for compatibility with Neon + migrations.

## Local development

Copy env vars from the Vercel project:

```bash
npx vercel env pull .env.local
```

For **Docker Postgres only** (no Neon), set **`DATABASE_URL`** and **`DATABASE_URL_UNPOOLED` to the same connection string** (see `.env.example`).

## Migrations

After schema changes:

```bash
npx prisma migrate dev   # local
# or against production (with care):
npx prisma migrate deploy
```

Use `cmd.exe` on Windows if `prisma migrate resolve` fails with PowerShell parsing of `--`.
