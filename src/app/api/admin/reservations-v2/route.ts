import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import {
  createReservationV2,
  markReservationV2AsRead,
  updateReservationV2Status,
} from "@/lib/reservation-v2-store";
import type { ReservationV2Payload } from "@/lib/types";

type Payload = Partial<ReservationV2Payload>;

const requiredFields: (keyof ReservationV2Payload)[] = [
  "locale",
  "fullName",
  "phone",
  "date",
  "time",
  "guests",
];

export async function POST(request: Request) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Payload | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  for (const field of requiredFields) {
    if (!payload[field]?.toString().trim()) {
      return NextResponse.json({ error: `${field} is required.` }, { status: 400 });
    }
  }

  if (payload.locale !== "en" && payload.locale !== "pt") {
    return NextResponse.json({ error: "locale must be 'en' or 'pt'." }, { status: 400 });
  }

  try {
    const createdReservation = await createReservationV2(payload as ReservationV2Payload);
    await updateReservationV2Status(createdReservation.id, "confirmed");
    const data = await markReservationV2AsRead(createdReservation.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create reservation." },
      { status: 400 },
    );
  }
}
