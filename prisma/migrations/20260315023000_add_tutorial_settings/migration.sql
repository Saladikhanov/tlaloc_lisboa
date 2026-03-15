-- CreateTable
CREATE TABLE "TutorialSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "businessPhone" TEXT NOT NULL,
  "businessEmail" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TutorialSettings_pkey" PRIMARY KEY ("id")
);
