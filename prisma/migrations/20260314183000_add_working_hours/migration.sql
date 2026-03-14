-- CreateTable
CREATE TABLE "WorkingHours" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "lunchOpen" TEXT,
    "lunchClose" TEXT,
    "dinnerOpen" TEXT,
    "dinnerClose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkingHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHours_weekday_key" ON "WorkingHours"("weekday");

-- CreateIndex
CREATE INDEX "WorkingHours_weekday_idx" ON "WorkingHours"("weekday");
