import type { ReservationV2 } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ReservationV2Payload, ReservationV2Record } from "@/lib/types";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const getPrisma = () => {
  if (!prisma) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return prisma;
};

const normalizeString = (value: string, field: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required.`);
  }
  return trimmed;
};

const normalizeOptionalString = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const toReservationV2Record = (reservation: ReservationV2): ReservationV2Record => ({
  id: reservation.id,
  locale: reservation.locale,
  fullName: reservation.fullName,
  phone: reservation.phone,
  email: reservation.email ?? undefined,
  date: reservation.date,
  time: reservation.time,
  guests: reservation.guests,
  otherInfo: reservation.otherInfo ?? undefined,
  isRead: reservation.isRead,
  isTest: reservation.isTest,
  status: reservation.status,
  archivedAt: reservation.archivedAt?.toISOString(),
  createdAt: reservation.createdAt.toISOString(),
  updatedAt: reservation.updatedAt.toISOString(),
});

export const createReservationV2 = async (
  payload: ReservationV2Payload,
): Promise<ReservationV2Record> => {
  const date = normalizeString(payload.date, "date");
  const time = normalizeString(payload.time, "time");
  if (!datePattern.test(date)) {
    throw new Error("date must be YYYY-MM-DD.");
  }
  if (!timePattern.test(time)) {
    throw new Error("time must be HH:MM.");
  }

  const reservation = await getPrisma().reservationV2.create({
    data: {
      locale: payload.locale,
      fullName: normalizeString(payload.fullName, "fullName"),
      phone: normalizeString(payload.phone, "phone"),
      email: normalizeOptionalString(payload.email) ?? null,
      date,
      time,
      guests: normalizeString(payload.guests, "guests"),
      otherInfo: normalizeOptionalString(payload.otherInfo) ?? null,
      isTest: payload.fullName.trim().toLowerCase() === "test",
    },
  });

  return toReservationV2Record(reservation);
};

export const listReservationsV2 = async (): Promise<ReservationV2Record[]> => {
  const reservations = await getPrisma().reservationV2.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return reservations.map(toReservationV2Record);
};

export const updateReservationV2Status = async (
  id: string,
  status: ReservationV2Record["status"],
): Promise<ReservationV2Record> => {
  const reservation = await getPrisma().reservationV2.update({
    where: { id },
    data: { status, isRead: status === "new" ? false : undefined },
  });

  return toReservationV2Record(reservation);
};

export const markReservationV2AsRead = async (id: string): Promise<ReservationV2Record> => {
  const reservation = await getPrisma().reservationV2.update({
    where: { id },
    data: { isRead: true },
  });

  return toReservationV2Record(reservation);
};

export const archiveReservationV2 = async (id: string): Promise<void> => {
  await getPrisma().reservationV2.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
};
