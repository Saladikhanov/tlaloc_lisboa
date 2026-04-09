CREATE TABLE "ReservationClosure" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationClosure_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReservationClosure_date_startTime_idx" ON "ReservationClosure"("date", "startTime");
