-- AlterTable
ALTER TABLE "Reservation"
ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Reservation_isRead_status_createdAt_idx"
ON "Reservation"("isRead", "status", "createdAt" DESC);
