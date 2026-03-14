import { prisma } from "@/lib/prisma";

export type WorkingHoursRecord = {
  id: string;
  weekday: number;
  isClosed: boolean;
  lunchOpen: string | null;
  lunchClose: string | null;
  dinnerOpen: string | null;
  dinnerClose: string | null;
};

const defaultWorkingHours: Omit<WorkingHoursRecord, "id">[] = [
  { weekday: 1, isClosed: false, lunchOpen: "12:00", lunchClose: "15:00", dinnerOpen: "18:00", dinnerClose: "22:00" },
  { weekday: 2, isClosed: false, lunchOpen: "12:00", lunchClose: "15:00", dinnerOpen: "18:00", dinnerClose: "22:00" },
  { weekday: 3, isClosed: false, lunchOpen: "12:00", lunchClose: "15:00", dinnerOpen: "18:00", dinnerClose: "22:00" },
  { weekday: 4, isClosed: false, lunchOpen: "12:00", lunchClose: "15:00", dinnerOpen: "18:00", dinnerClose: "22:00" },
  { weekday: 5, isClosed: false, lunchOpen: "12:00", lunchClose: "15:00", dinnerOpen: "18:00", dinnerClose: "23:00" },
  { weekday: 6, isClosed: false, lunchOpen: "12:00", lunchClose: "15:00", dinnerOpen: "18:00", dinnerClose: "23:00" },
  { weekday: 0, isClosed: true, lunchOpen: null, lunchClose: null, dinnerOpen: null, dinnerClose: null },
];

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const sortByWeekday = <T extends { weekday: number }>(rows: T[]): T[] =>
  [...rows].sort((a, b) => a.weekday - b.weekday);

const toTimeMinutes = (value: string): number => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const normalizeTime = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return timePattern.test(trimmed) ? trimmed : null;
};

const isShiftOpenForTime = (
  selectedTimeMinutes: number,
  open: string | null,
  close: string | null,
): boolean => {
  if (!open || !close) {
    return false;
  }

  const openMinutes = toTimeMinutes(open);
  const closeMinutes = toTimeMinutes(close);
  if (openMinutes >= closeMinutes) {
    return false;
  }

  return selectedTimeMinutes >= openMinutes && selectedTimeMinutes <= closeMinutes;
};

const ensureDefaultRowsWithIds = (rows: WorkingHoursRecord[]): WorkingHoursRecord[] => {
  const byWeekday = new Map(rows.map((row) => [row.weekday, row]));
  const syntheticBase = "default-working-hours";

  return sortByWeekday(
    defaultWorkingHours.map((candidate) => {
      const fromDb = byWeekday.get(candidate.weekday);
      if (fromDb) {
        return fromDb;
      }

      return {
        id: `${syntheticBase}-${candidate.weekday}`,
        ...candidate,
      };
    }),
  );
};

export const ensureWorkingHoursSeeded = async (): Promise<void> => {
  if (!prisma) {
    return;
  }

  const count = await prisma.workingHours.count();
  if (count > 0) {
    return;
  }

  await prisma.workingHours.createMany({
    data: defaultWorkingHours,
    skipDuplicates: true,
  });
};

export const listWorkingHours = async (): Promise<WorkingHoursRecord[]> => {
  if (!prisma) {
    return ensureDefaultRowsWithIds([]);
  }

  try {
    await ensureWorkingHoursSeeded();
    const rows = await prisma.workingHours.findMany({
      orderBy: { weekday: "asc" },
    });

    return ensureDefaultRowsWithIds(rows);
  } catch {
    // Keep public pages resilient when DB is temporarily unavailable.
    return ensureDefaultRowsWithIds([]);
  }
};

export const saveWorkingHours = async (
  payload: Omit<WorkingHoursRecord, "id">[],
): Promise<WorkingHoursRecord[]> => {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }
  const db = prisma;

  const cleaned = sortByWeekday(payload).map((row) => {
    const lunchOpen = normalizeTime(row.lunchOpen);
    const lunchClose = normalizeTime(row.lunchClose);
    const dinnerOpen = normalizeTime(row.dinnerOpen);
    const dinnerClose = normalizeTime(row.dinnerClose);

    return {
      weekday: row.weekday,
      isClosed: row.isClosed,
      lunchOpen: row.isClosed ? null : lunchOpen,
      lunchClose: row.isClosed ? null : lunchClose,
      dinnerOpen: row.isClosed ? null : dinnerOpen,
      dinnerClose: row.isClosed ? null : dinnerClose,
    };
  });

  await db.$transaction(
    cleaned.map((row) =>
      db.workingHours.upsert({
        where: { weekday: row.weekday },
        create: row,
        update: row,
      }),
    ),
  );

  return listWorkingHours();
};

export const isReservationWithinWorkingHours = async (
  dateValue: string,
  timeValue: string,
): Promise<boolean> => {
  if (!timePattern.test(timeValue)) {
    return false;
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!dateMatch) {
    return false;
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const weekday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
  const selectedTimeMinutes = toTimeMinutes(timeValue);

  const hours = await listWorkingHours();
  const dayHours = hours.find((row) => row.weekday === weekday);
  if (!dayHours || dayHours.isClosed) {
    return false;
  }

  return (
    isShiftOpenForTime(selectedTimeMinutes, dayHours.lunchOpen, dayHours.lunchClose) ||
    isShiftOpenForTime(selectedTimeMinutes, dayHours.dinnerOpen, dayHours.dinnerClose)
  );
};
