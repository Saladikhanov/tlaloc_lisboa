import { NextResponse } from "next/server";
import { listAvailableReservationSlots } from "@/lib/reservation-request-availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

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
