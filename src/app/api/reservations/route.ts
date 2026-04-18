import { NextResponse } from "next/server";
import { createReservation, listReservations } from "@/lib/reservation-store";
import {
  sendReservationRequestEmails,
  sendReservationRequestWhatsApp,
  sendReservationEmails,
  sendReservationWhatsApp,
} from "@/lib/notifications";
import type { ReservationPayload, ReservationRequestPayload } from "@/lib/types";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { getReservationBlockingClosure } from "@/lib/reservation-closure-store";
import { listAvailableReservationSlots } from "@/lib/reservation-request-availability";
import { createReservationRequest } from "@/lib/reservation-request-store";
import { isReservationWithinWorkingHours } from "@/lib/working-hours-store";

const legacyRequiredFields: (keyof ReservationPayload)[] = [
  "locale",
  "firstName",
  "lastName",
  "phone",
  "email",
  "date",
  "time",
  "guests",
];

const requestRequiredFields: (keyof ReservationRequestPayload)[] = [
  "locale",
  "fullName",
  "phone",
  "date",
  "time",
  "guests",
];

type ReservationPostPayload = Partial<ReservationPayload & ReservationRequestPayload>;

const hasModernReservationShape = (
  payload: ReservationPostPayload,
): payload is Partial<ReservationRequestPayload> => typeof payload.fullName === "string";

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
  const payload = (await request.json()) as ReservationPostPayload;

  if (hasModernReservationShape(payload)) {
    for (const field of requestRequiredFields) {
      if (!payload[field]?.toString().trim()) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    if (payload.locale !== "en" && payload.locale !== "pt") {
      return NextResponse.json({ error: "locale must be 'en' or 'pt'" }, { status: 400 });
    }

    const availableSlots = await listAvailableReservationSlots(payload.date as string);
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
      const reservation = await createReservationRequest(payload as ReservationRequestPayload);
      const [emailStatus, whatsappStatus] = await Promise.all([
        sendReservationRequestEmails(reservation),
        sendReservationRequestWhatsApp(reservation),
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

  const legacyPayload = payload as Partial<ReservationPayload>;

  for (const field of legacyRequiredFields) {
    if (!legacyPayload[field]?.toString().trim()) {
      return NextResponse.json(
        { error: `${field} is required` },
        { status: 400 },
      );
    }
  }

  if (legacyPayload.locale !== "en" && legacyPayload.locale !== "pt") {
    return NextResponse.json(
      { error: "locale must be 'en' or 'pt'" },
      { status: 400 },
    );
  }

  const withinWorkingHours = await isReservationWithinWorkingHours(
    legacyPayload.date as string,
    legacyPayload.time as string,
  );
  if (!withinWorkingHours) {
    const errorMessage =
      legacyPayload.locale === "pt"
        ? "Reservas disponiveis apenas durante os dias e horarios de funcionamento."
        : "Reservations are available only during working days and hours.";
    return NextResponse.json(
      { error: errorMessage, code: "outside_working_hours" },
      { status: 400 },
    );
  }

  const blockingClosure = await getReservationBlockingClosure(
    legacyPayload.date as string,
    legacyPayload.time as string,
  );
  if (blockingClosure) {
    const errorMessage =
      legacyPayload.locale === "pt"
        ? `Desculpe, estamos lotados entre ${blockingClosure.startTime} e ${blockingClosure.endTime} nesse dia. Escolha outro horario ou outro dia.`
        : `Sorry, we are full from ${blockingClosure.startTime} to ${blockingClosure.endTime} on that day. Please choose another time or another day.`;
    return NextResponse.json(
      { error: errorMessage, code: "time_window_full" },
      { status: 400 },
    );
  }

  try {
    const reservation = await createReservation(legacyPayload as ReservationPayload);
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
