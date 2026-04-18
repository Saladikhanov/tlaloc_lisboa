ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'no_show';

CREATE TYPE "RewardType" AS ENUM ('percent', 'fixed_amount', 'free_item', 'custom');
CREATE TYPE "RewardCodeStatus" AS ENUM ('active', 'used', 'cancelled');

CREATE TABLE "RewardProgramSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "visitThreshold" INTEGER NOT NULL DEFAULT 3,
    "rewardType" "RewardType" NOT NULL DEFAULT 'percent',
    "rewardValue" TEXT NOT NULL DEFAULT '10',
    "rewardLabel" TEXT NOT NULL DEFAULT '10% off',
    "messageEn" TEXT,
    "messagePt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardProgramSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RewardCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "RewardCodeStatus" NOT NULL DEFAULT 'active',
    "phoneKey" TEXT,
    "emailKey" TEXT,
    "guestName" TEXT,
    "rewardType" "RewardType" NOT NULL,
    "rewardValue" TEXT NOT NULL,
    "rewardLabel" TEXT NOT NULL,
    "messageEn" TEXT,
    "messagePt" TEXT,
    "generatedAfterConfirmedCount" INTEGER NOT NULL,
    "originReservationId" TEXT,
    "originReservationVersion" TEXT,
    "usedByReservationId" TEXT,
    "usedByReservationVersion" TEXT,
    "usedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RewardCode_code_key" ON "RewardCode"("code");
CREATE INDEX "RewardCode_status_createdAt_idx" ON "RewardCode"("status", "createdAt" DESC);
CREATE INDEX "RewardCode_phoneKey_status_idx" ON "RewardCode"("phoneKey", "status");
CREATE INDEX "RewardCode_emailKey_status_idx" ON "RewardCode"("emailKey", "status");
