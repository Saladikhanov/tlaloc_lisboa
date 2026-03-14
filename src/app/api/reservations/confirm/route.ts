import { NextResponse } from "next/server";
import { verifyReservationConfirmToken } from "@/lib/reservation-confirmation";
import { updateReservationStatus } from "@/lib/reservation-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? undefined;
  const reservationId = verifyReservationConfirmToken(token);

  if (!reservationId) {
    return NextResponse.redirect(new URL("/en/reserve?confirm=invalid", request.url));
  }

  try {
    const reservation = await updateReservationStatus(reservationId, "confirmed");
    return NextResponse.redirect(
      new URL(`/${reservation.locale}/reserve?confirm=success`, request.url),
    );
  } catch {
    return NextResponse.redirect(new URL("/en/reserve?confirm=error", request.url));
  }
}
