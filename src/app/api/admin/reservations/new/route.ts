import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { listNewReservationSummaries } from "@/lib/reservation-v2-store";

export const dynamic = "force-dynamic";

// Light check used by the back office to notice bookings made on another server instance:
// only reservations created after `since`, with just what an alert needs.
export async function GET(request: Request) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(new URL(request.url).searchParams.get("since") ?? "");
  if (Number.isNaN(since.getTime())) {
    return NextResponse.json({ error: "since must be an ISO date" }, { status: 400 });
  }

  try {
    return NextResponse.json({ data: await listNewReservationSummaries(since) });
  } catch {
    return NextResponse.json(
      { error: "Database is not ready. Check PostgreSQL connection." },
      { status: 500 },
    );
  }
}
