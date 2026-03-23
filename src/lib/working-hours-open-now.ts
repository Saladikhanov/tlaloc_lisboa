import type { WorkingHoursRecord } from "@/lib/working-hours-store";

const toMinutes = (timeValue: string | null): number | null => {
  if (!timeValue) {
    return null;
  }

  const [hoursString, minutesString] = timeValue.split(":");
  const hours = Number(hoursString);
  const minutes = Number(minutesString);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const isOpenNowForDay = (dayHours: WorkingHoursRecord, currentMinutes: number): boolean => {
  if (dayHours.isClosed) {
    return false;
  }

  const isInsideShift = (open: string | null, close: string | null) => {
    const openMinutes = toMinutes(open);
    const closeMinutes = toMinutes(close);
    if (openMinutes === null || closeMinutes === null || openMinutes >= closeMinutes) {
      return false;
    }
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  };

  return (
    isInsideShift(dayHours.lunchOpen, dayHours.lunchClose) ||
    isInsideShift(dayHours.dinnerOpen, dayHours.dinnerClose)
  );
};

export const getLisbonNow = (): { weekday: number; minutes: number } => {
  const weekdayShort = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Europe/Lisbon",
  }).format(new Date());

  const timeValue = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Lisbon",
  }).format(new Date());

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const [hoursString, minutesString] = timeValue.split(":");
  const hours = Number(hoursString) || 0;
  const minutes = Number(minutesString) || 0;
  return {
    weekday: weekdayMap[weekdayShort] ?? 0,
    minutes: hours * 60 + minutes,
  };
};

export function computeIsOpenNow(schedule: WorkingHoursRecord[]): boolean {
  const lisbonNow = getLisbonNow();
  const todayHours = schedule.find((entry) => entry.weekday === lisbonNow.weekday);
  return todayHours ? isOpenNowForDay(todayHours, lisbonNow.minutes) : false;
}
