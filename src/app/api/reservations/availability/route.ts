import { NextResponse } from "next/server";
import {
  listAvailableReservationSlots,
  listAvailableReservationSlotsForMonth,
} from "@/lib/reservation-request-availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  if (date) {
    try {
      const data = await listAvailableReservationSlots(date);
      return NextResponse.json({ data });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not load availability." },
        { status: 500 },
      );
    }
  }

  if (month) {
    try {
      const data = await listAvailableReservationSlotsForMonth(month);
      return NextResponse.json({ data });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not load availability." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: "date or month is required" }, { status: 400 });
}
