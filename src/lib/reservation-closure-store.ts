import { prisma } from "@/lib/prisma";

export type ReservationClosureRecord = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toTimeMinutes = (value: string): number => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const normalizeDate = (value: string): string => {
  const trimmed = value.trim();
  if (!datePattern.test(trimmed)) {
    throw new Error("date must be YYYY-MM-DD.");
  }
  return trimmed;
};

const normalizeTime = (value: string, field: string): string => {
  const trimmed = value.trim();
  if (!timePattern.test(trimmed)) {
    throw new Error(`${field} must be HH:MM.`);
  }
  return trimmed;
};

const toRecord = (row: {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  note: string | null;
}): ReservationClosureRecord => ({
  id: row.id,
  date: row.date,
  startTime: row.startTime,
  endTime: row.endTime,
  note: row.note ?? undefined,
});

export const listReservationClosures = async (): Promise<ReservationClosureRecord[]> => {
  if (!prisma) {
    return [];
  }

  const rows = await prisma.reservationClosure.findMany({
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return rows.map(toRecord);
};

export const listReservationClosuresForDate = async (
  date: string,
): Promise<ReservationClosureRecord[]> => {
  if (!prisma) {
    return [];
  }

  const normalizedDate = normalizeDate(date);
  const rows = await prisma.reservationClosure.findMany({
    where: { date: normalizedDate },
    orderBy: { startTime: "asc" },
  });

  return rows.map(toRecord);
};

export const listReservationClosuresForMonth = async (
  month: string,
): Promise<ReservationClosureRecord[]> => {
  if (!prisma) {
    return [];
  }
  const normalizedMonth = month.trim();
  if (!/^[0-9]{4}-[0-9]{2}$/.test(normalizedMonth)) {
    return [];
  }

  const rows = await prisma.reservationClosure.findMany({
    where: {
      date: {
        startsWith: `${normalizedMonth}-`,
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return rows.map(toRecord);
};

export const createReservationClosure = async (payload: {
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
}): Promise<ReservationClosureRecord> => {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const date = normalizeDate(payload.date);
  const startTime = normalizeTime(payload.startTime, "startTime");
  const endTime = normalizeTime(payload.endTime, "endTime");

  if (toTimeMinutes(startTime) >= toTimeMinutes(endTime)) {
    throw new Error("endTime must be later than startTime.");
  }

  const row = await prisma.reservationClosure.create({
    data: {
      date,
      startTime,
      endTime,
      note: payload.note?.trim() || null,
    },
  });

  return toRecord(row);
};

export const deleteReservationClosure = async (id: string): Promise<void> => {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  await prisma.reservationClosure.delete({
    where: { id },
  });
};

export const getReservationBlockingClosure = async (
  date: string,
  time: string,
): Promise<ReservationClosureRecord | null> => {
  if (!prisma) {
    return null;
  }
  if (!datePattern.test(date) || !timePattern.test(time)) {
    return null;
  }

  const minutes = toTimeMinutes(time);
  const rows = await prisma.reservationClosure.findMany({
    where: { date },
  });

  const match = rows.find((row) => {
    const start = toTimeMinutes(row.startTime);
    const end = toTimeMinutes(row.endTime);
    return minutes >= start && minutes < end;
  });

  return match ? toRecord(match) : null;
};
