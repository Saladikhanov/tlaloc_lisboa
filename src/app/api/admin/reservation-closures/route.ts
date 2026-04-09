import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import {
  createReservationClosure,
  listReservationClosures,
} from "@/lib/reservation-closure-store";

type Payload = {
  date?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  note?: unknown;
};

export async function GET() {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json({ data: await listReservationClosures() });
  } catch (error) {
    console.error("Could not load reservation closures:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load reservation closures.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Payload | null;
  if (
    typeof payload?.date !== "string" ||
    typeof payload?.startTime !== "string" ||
    typeof payload?.endTime !== "string"
  ) {
    return NextResponse.json(
      { error: "date, startTime and endTime are required." },
      { status: 400 },
    );
  }

  try {
    const data = await createReservationClosure({
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      note: typeof payload.note === "string" ? payload.note : undefined,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Could not create reservation closure:", error);
    const message =
      error instanceof Error ? error.message : "Could not create reservation closure.";
    const status =
      error instanceof Error &&
      (message === "Database is not configured." ||
        message.includes("Cannot read properties of undefined"))
        ? 500
        : 400;
    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
