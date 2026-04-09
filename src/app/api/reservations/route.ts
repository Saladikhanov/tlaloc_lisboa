import { NextResponse } from "next/server";
import { createReservation, listReservations } from "@/lib/reservation-store";
import {
  sendReservationEmails,
  sendReservationWhatsApp,
} from "@/lib/notifications";
import type { ReservationPayload } from "@/lib/types";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { getReservationBlockingClosure } from "@/lib/reservation-closure-store";
import { isReservationWithinWorkingHours } from "@/lib/working-hours-store";

const requiredFields: (keyof ReservationPayload)[] = [
  "locale",
  "firstName",
  "lastName",
  "phone",
  "email",
  "date",
  "time",
  "guests",
];

export async function GET() {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json({ data: await listReservations() });
  } catch {
    return NextResponse.json(
      { error: "Database is not ready. Check PostgreSQL connection." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<ReservationPayload>;

  for (const field of requiredFields) {
    if (!payload[field]?.toString().trim()) {
      return NextResponse.json(
        { error: `${field} is required` },
        { status: 400 },
      );
    }
  }

  if (payload.locale !== "en" && payload.locale !== "pt") {
    return NextResponse.json(
      { error: "locale must be 'en' or 'pt'" },
      { status: 400 },
    );
  }

  const withinWorkingHours = await isReservationWithinWorkingHours(
    payload.date as string,
    payload.time as string,
  );
  if (!withinWorkingHours) {
    const errorMessage =
      payload.locale === "pt"
        ? "Reservas disponiveis apenas durante os dias e horarios de funcionamento."
        : "Reservations are available only during working days and hours.";
    return NextResponse.json(
      { error: errorMessage, code: "outside_working_hours" },
      { status: 400 },
    );
  }

  const blockingClosure = await getReservationBlockingClosure(
    payload.date as string,
    payload.time as string,
  );
  if (blockingClosure) {
    const errorMessage =
      payload.locale === "pt"
        ? `Desculpe, estamos lotados entre ${blockingClosure.startTime} e ${blockingClosure.endTime} nesse dia. Escolha outro horario ou outro dia.`
        : `Sorry, we are full from ${blockingClosure.startTime} to ${blockingClosure.endTime} on that day. Please choose another time or another day.`;
    return NextResponse.json(
      { error: errorMessage, code: "time_window_full" },
      { status: 400 },
    );
  }

  try {
    const reservation = await createReservation(payload as ReservationPayload);
    const [emailStatus, whatsappStatus] = await Promise.all([
      sendReservationEmails(reservation),
      sendReservationWhatsApp(reservation),
    ]);

    return NextResponse.json(
      {
        data: reservation,
        message: "Reservation created",
        notifications: [emailStatus, whatsappStatus],
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not store reservation. Check database configuration." },
      { status: 500 },
    );
  }
}
