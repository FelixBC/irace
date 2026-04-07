-- CreateSchema
-- (normalized to UTF-8 without BOM)
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Sport" AS ENUM ('RUNNING', 'CYCLING', 'SWIMMING', 'WALKING', 'HIKING', 'YOGA', 'WEIGHT_TRAINING');

-- CreateEnum
CREATE TYPE "public"."ChallengeType" AS ENUM ('DISTANCE', 'TIME', 'FREQUENCY');

-- CreateEnum
CREATE TYPE "public"."ChallengeStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'DRAFT');

-- CreateEnum
CREATE TYPE "public"."ParticipationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED', 'INVITED');

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "stravaId" TEXT,
    "stravaTokens" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Challenge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sports" "public"."Sport"[],
    "challengeType" "public"."ChallengeType" NOT NULL DEFAULT 'DISTANCE',
    "goal" DOUBLE PRECISION NOT NULL,
    "goalUnit" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "inviteCode" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL DEFAULT 10,
    "status" "public"."ChallengeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,
    "sportGoals" JSONB,
    "creatorParticipantSharingAckAt" TIMESTAMP(3),

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Participation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "avatarId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."ParticipationStatus" NOT NULL DEFAULT 'ACTIVE',
    "progress" JSONB,
    "lastActivityDate" TIMESTAMP(3),
    "currentDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "challengeDataConsentAt" TIMESTAMP(3),
    "challengeDataConsentVersion" TEXT NOT NULL DEFAULT '1',

    CONSTRAINT "Participation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Activity" (
    "id" TEXT NOT NULL,
    "stravaActivityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT,
    "sport" "public"."Sport" NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Avatar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sport" "public"."Sport" NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avatar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stravaId_key" ON "public"."User"("stravaId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_inviteCode_key" ON "public"."Challenge"("inviteCode");

-- CreateIndex
CREATE INDEX "Challenge_creatorId_idx" ON "public"."Challenge"("creatorId");

-- CreateIndex
CREATE INDEX "Challenge_startDate_endDate_idx" ON "public"."Challenge"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Challenge_inviteCode_idx" ON "public"."Challenge"("inviteCode");

-- CreateIndex
CREATE INDEX "Challenge_status_idx" ON "public"."Challenge"("status");

-- CreateIndex
CREATE INDEX "Challenge_isPublic_idx" ON "public"."Challenge"("isPublic");

-- CreateIndex
CREATE INDEX "Participation_userId_idx" ON "public"."Participation"("userId");

-- CreateIndex
CREATE INDEX "Participation_challengeId_idx" ON "public"."Participation"("challengeId");

-- CreateIndex
CREATE INDEX "Participation_status_idx" ON "public"."Participation"("status");

-- CreateIndex
CREATE INDEX "Participation_avatarId_idx" ON "public"."Participation"("avatarId");

-- CreateIndex
CREATE UNIQUE INDEX "Participation_userId_challengeId_key" ON "public"."Participation"("userId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_stravaActivityId_key" ON "public"."Activity"("stravaActivityId");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "public"."Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_challengeId_idx" ON "public"."Activity"("challengeId");

-- CreateIndex
CREATE INDEX "Activity_sport_idx" ON "public"."Activity"("sport");

-- CreateIndex
CREATE INDEX "Activity_date_idx" ON "public"."Activity"("date");

-- CreateIndex
CREATE INDEX "Activity_stravaActivityId_idx" ON "public"."Activity"("stravaActivityId");

-- CreateIndex
CREATE INDEX "Avatar_sport_idx" ON "public"."Avatar"("sport");

-- CreateIndex
CREATE INDEX "Avatar_isPremium_idx" ON "public"."Avatar"("isPremium");

-- CreateIndex
CREATE INDEX "Avatar_isActive_idx" ON "public"."Avatar"("isActive");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Challenge" ADD CONSTRAINT "Challenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Participation" ADD CONSTRAINT "Participation_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Participation" ADD CONSTRAINT "Participation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

