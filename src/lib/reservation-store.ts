import type { Reservation } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ReservationPayload, ReservationRecord } from "@/lib/types";

const getPrisma = () => {
  if (!prisma) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return prisma;
};

const toReservationRecord = (reservation: Reservation): ReservationRecord => {
  return {
    id: reservation.id,
    locale: reservation.locale,
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    phone: reservation.phone,
    email: reservation.email,
    date: reservation.date,
    time: reservation.time,
    guests: reservation.guests,
    occasion: reservation.occasion ?? undefined,
    notes: reservation.notes ?? undefined,
    status: reservation.status,
    createdAt: reservation.createdAt.toISOString(),
  };
};

export const createReservation = async (
  payload: ReservationPayload,
): Promise<ReservationRecord> => {
  const reservation = await getPrisma().reservation.create({
    data: {
      locale: payload.locale,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      email: payload.email,
      date: payload.date,
      time: payload.time,
      guests: payload.guests,
      occasion: payload.occasion,
      notes: payload.notes,
    },
  });

  return toReservationRecord(reservation);
};

export const listReservations = async (): Promise<ReservationRecord[]> => {
  const reservations = await getPrisma().reservation.findMany({
    orderBy: { createdAt: "desc" },
  });

  return reservations.map(toReservationRecord);
};

export const updateReservationStatus = async (
  id: string,
  status: ReservationRecord["status"],
): Promise<ReservationRecord> => {
  const reservation = await getPrisma().reservation.update({
    where: { id },
    data: { status },
  });

  return toReservationRecord(reservation);
};
