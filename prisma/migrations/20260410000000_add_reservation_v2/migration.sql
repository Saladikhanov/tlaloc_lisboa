CREATE TABLE "ReservationV2" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "guests" TEXT NOT NULL,
    "otherInfo" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReservationStatus" NOT NULL DEFAULT 'new',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationV2_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReservationV2_createdAt_idx" ON "ReservationV2"("createdAt" DESC);
CREATE INDEX "ReservationV2_date_time_idx" ON "ReservationV2"("date", "time");
CREATE INDEX "ReservationV2_isRead_status_createdAt_idx" ON "ReservationV2"("isRead", "status", "createdAt" DESC);
CREATE INDEX "ReservationV2_archivedAt_idx" ON "ReservationV2"("archivedAt");
