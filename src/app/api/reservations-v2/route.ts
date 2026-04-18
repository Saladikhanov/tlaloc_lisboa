import { NextResponse } from "next/server";
import {
  sendReservationV2Emails,
  sendReservationV2WhatsApp,
} from "@/lib/notifications";
import { createReservationV2, listReservationsV2 } from "@/lib/reservation-v2-store";
import { listAvailableReservationV2Slots } from "@/lib/reservation-v2-availability";
import type { ReservationV2Payload } from "@/lib/types";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { publishAdminEvent } from "@/lib/admin-events";

const requiredFields: (keyof ReservationV2Payload)[] = [
  "locale",
  "fullName",
  "phone",
  "date",
  "time",
  "guests",
];

export async function GET() {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json({ data: await listReservationsV2() });
  } catch {
    return NextResponse.json(
      { error: "Database is not ready. Check PostgreSQL connection." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<ReservationV2Payload>;

  for (const field of requiredFields) {
    if (!payload[field]?.toString().trim()) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  if (payload.locale !== "en" && payload.locale !== "pt") {
    return NextResponse.json({ error: "locale must be 'en' or 'pt'" }, { status: 400 });
  }

  const availableSlots = await listAvailableReservationV2Slots(payload.date as string);
  if (!availableSlots.includes(payload.time as string)) {
    const errorMessage =
      payload.locale === "pt"
        ? "Desculpe, estamos lotados ou indisponiveis nesse horario. Escolha outro horario."
        : "Sorry, we are full or unavailable for that time. Please choose another slot.";
    return NextResponse.json(
      { error: errorMessage, code: "slot_unavailable" },
      { status: 400 },
    );
  }

  try {
    const reservation = await createReservationV2(payload as ReservationV2Payload);
    publishAdminEvent({
      type: "reservation_created",
      reservationId: reservation.id,
      reservationVersion: "v2",
      guestName: reservation.fullName,
      date: reservation.date,
      time: reservation.time,
      createdAt: new Date().toISOString(),
    });
    const [emailStatus, whatsappStatus] = await Promise.all([
      sendReservationV2Emails(reservation),
      sendReservationV2WhatsApp(reservation),
    ]);

    return NextResponse.json(
      {
        data: reservation,
        message: "Reservation created",
        notifications: [emailStatus, whatsappStatus],
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not store reservation." },
      { status: 500 },
    );
  }
}
