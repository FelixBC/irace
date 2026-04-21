-- Session model: 15-minute access JWT + 30-day refresh (opaque) + optional OAuth exchange handoff.
-- Existing sessions are cleared; users must sign in again.

DELETE FROM "public"."Session";

DROP INDEX IF EXISTS "public"."Session_sessionToken_key";

ALTER TABLE "public"."Session" DROP COLUMN IF EXISTS "sessionToken";
ALTER TABLE "public"."Session" DROP COLUMN IF EXISTS "expires";

ALTER TABLE "public"."Session" ADD COLUMN "refreshTokenHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "public"."Session" ADD COLUMN "refreshExpiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "public"."Session" ADD COLUMN "pendingRefreshToken" TEXT;
ALTER TABLE "public"."Session" ADD COLUMN "exchangeTokenHash" TEXT;
ALTER TABLE "public"."Session" ADD COLUMN "exchangeExpiresAt" TIMESTAMP(3);

ALTER TABLE "public"."Session" ALTER COLUMN "refreshTokenHash" DROP DEFAULT;
ALTER TABLE "public"."Session" ALTER COLUMN "refreshExpiresAt" DROP DEFAULT;

CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "public"."Session"("refreshTokenHash");
CREATE UNIQUE INDEX "Session_exchangeTokenHash_key" ON "public"."Session"("exchangeTokenHash");
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");
