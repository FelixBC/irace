-- AlterTable
ALTER TABLE "public"."Challenge" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Participation" ADD COLUMN     "finalDistance" DOUBLE PRECISION,
ADD COLUMN     "finishPosition" INTEGER,
ADD COLUMN     "finishedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."ChallengeTaunt" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "presetKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeTaunt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChallengeTaunt_challengeId_createdAt_idx" ON "public"."ChallengeTaunt"("challengeId", "createdAt");

-- CreateIndex
CREATE INDEX "ChallengeTaunt_userId_idx" ON "public"."ChallengeTaunt"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Participation_challengeId_finishPosition_key" ON "public"."Participation"("challengeId", "finishPosition");

-- AddForeignKey
ALTER TABLE "public"."ChallengeTaunt" ADD CONSTRAINT "ChallengeTaunt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeTaunt" ADD CONSTRAINT "ChallengeTaunt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

