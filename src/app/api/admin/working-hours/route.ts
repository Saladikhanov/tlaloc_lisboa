import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { listWorkingHours, saveWorkingHours } from "@/lib/working-hours-store";

type UpdateWorkingHoursPayload = {
  data?: Array<{
    weekday?: unknown;
    isClosed?: unknown;
    lunchOpen?: unknown;
    lunchClose?: unknown;
    dinnerOpen?: unknown;
    dinnerClose?: unknown;
  }>;
};

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const normalizeTime = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return timePattern.test(trimmed) ? trimmed : null;
};

export async function GET() {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await listWorkingHours();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not load working hours." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as UpdateWorkingHoursPayload | null;
  if (!payload?.data || !Array.isArray(payload.data) || payload.data.length === 0) {
    return NextResponse.json({ error: "No working hours data provided." }, { status: 400 });
  }

  const seen = new Set<number>();
  const cleaned: Array<{
    weekday: number;
    isClosed: boolean;
    lunchOpen: string | null;
    lunchClose: string | null;
    dinnerOpen: string | null;
    dinnerClose: string | null;
  }> = [];

  for (const row of payload.data) {
    if (typeof row.weekday !== "number" || !Number.isInteger(row.weekday) || row.weekday < 0 || row.weekday > 6) {
      return NextResponse.json({ error: "weekday must be an integer between 0 and 6." }, { status: 400 });
    }
    if (seen.has(row.weekday)) {
      return NextResponse.json({ error: "Duplicate weekday in payload." }, { status: 400 });
    }
    seen.add(row.weekday);

    const isClosed = Boolean(row.isClosed);
    cleaned.push({
      weekday: row.weekday,
      isClosed,
      lunchOpen: isClosed ? null : normalizeTime(row.lunchOpen),
      lunchClose: isClosed ? null : normalizeTime(row.lunchClose),
      dinnerOpen: isClosed ? null : normalizeTime(row.dinnerOpen),
      dinnerClose: isClosed ? null : normalizeTime(row.dinnerClose),
    });
  }

  try {
    const data = await saveWorkingHours(cleaned);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not save working hours." }, { status: 500 });
  }
}
