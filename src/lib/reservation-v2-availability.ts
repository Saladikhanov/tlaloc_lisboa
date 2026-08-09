import {
  listReservationClosuresForDate,
  listReservationClosuresForMonth,
} from "@/lib/reservation-closure-store";
import { listWorkingHours } from "@/lib/working-hours-store";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const toMinutes = (value: string): number => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const toTimeLabel = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
};

const getLisbonNow = (): { isoDate: string; minutes: number } => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    isoDate: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
    minutes: Number(getPart("hour")) * 60 + Number(getPart("minute")),
  };
};

const getEarliestSameDaySlotMinutes = (date: string): number | null => {
  const lisbonNow = getLisbonNow();
  if (date !== lisbonNow.isoDate) {
    return null;
  }

  const oneHourLater = lisbonNow.minutes + 60;
  return Math.ceil(oneHourLater / 30) * 30;
};

const getWeekday = (date: string): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return null;
  }

  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0),
  ).getUTCDay();
};

export const listAvailableReservationV2Slots = async (date: string): Promise<string[]> => {
  if (!datePattern.test(date)) {
    return [];
  }

  const weekday = getWeekday(date);
  if (weekday === null) {
    return [];
  }

  const [hours, closures] = await Promise.all([
    listWorkingHours(),
    listReservationClosuresForDate(date),
  ]);
  const dayHours = hours.find((entry) => entry.weekday === weekday);
  if (!dayHours || dayHours.isClosed) {
    return [];
  }

  const shifts: Array<[string | null, string | null]> = [
    [dayHours.lunchOpen, dayHours.lunchClose],
    [dayHours.dinnerOpen, dayHours.dinnerClose],
  ];
  const slots: string[] = [];
  const earliestSameDaySlotMinutes = getEarliestSameDaySlotMinutes(date);

  for (const [open, close] of shifts) {
    if (!open || !close) {
      continue;
    }

    const openMinutes = toMinutes(open);
    const closeMinutes = toMinutes(close);
    if (openMinutes >= closeMinutes) {
      continue;
    }

    for (let value = openMinutes; value < closeMinutes; value += 30) {
      if (earliestSameDaySlotMinutes !== null && value < earliestSameDaySlotMinutes) {
        continue;
      }

      const blocked = closures.some((closure) => {
        const start = toMinutes(closure.startTime);
        const end = toMinutes(closure.endTime);
        return value >= start && value < end;
      });

      if (!blocked) {
        slots.push(toTimeLabel(value));
      }
    }
  }

  return slots;
};

const monthPattern = /^\d{4}-\d{2}$/;

export const listAvailableReservationV2MonthAvailability = async (
  month: string,
): Promise<Record<string, boolean>> => {
  if (!monthPattern.test(month)) {
    return {};
  }

  const [hours, closures] = await Promise.all([
    listWorkingHours(),
    listReservationClosuresForMonth(month),
  ]);

  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const availability: Record<string, boolean> = {};

  const getBlockedSlot = (value: number, closuresForDate: typeof closures) =>
    closuresForDate.some((closure) => {
      const start = toMinutes(closure.startTime);
      const end = toMinutes(closure.endTime);
      return value >= start && value < end;
    });

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isoDate = `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const weekday = getWeekday(isoDate);
    const dayHours = weekday === null ? null : hours.find((entry) => entry.weekday === weekday);

    if (!dayHours || dayHours.isClosed) {
      availability[isoDate] = false;
      continue;
    }

    const dateClosures = closures.filter((closure) => closure.date === isoDate);
    const earliestSameDaySlotMinutes = getEarliestSameDaySlotMinutes(isoDate);
    let hasAvailableSlot = false;

    for (const [open, close] of [
      [dayHours.lunchOpen, dayHours.lunchClose],
      [dayHours.dinnerOpen, dayHours.dinnerClose],
    ] as Array<[string | null, string | null]>) {
      if (!open || !close) {
        continue;
      }

      const openMinutes = toMinutes(open);
      const closeMinutes = toMinutes(close);
      if (openMinutes >= closeMinutes) {
        continue;
      }

      for (let value = openMinutes; value < closeMinutes; value += 30) {
        if (earliestSameDaySlotMinutes !== null && value < earliestSameDaySlotMinutes) {
          continue;
        }

        if (!getBlockedSlot(value, dateClosures)) {
          hasAvailableSlot = true;
          break;
        }
      }

      if (hasAvailableSlot) {
        break;
      }
    }

    availability[isoDate] = hasAvailableSlot;
  }

  return availability;
};
