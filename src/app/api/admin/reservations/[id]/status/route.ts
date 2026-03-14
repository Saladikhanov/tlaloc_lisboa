import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { updateReservationStatus } from "@/lib/reservation-store";

type Payload = {
  status?: unknown;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const payload = (await request.json().catch(() => null)) as Payload | null;
  const status = payload?.status;

  if (status !== "new" && status !== "confirmed" && status !== "cancelled") {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    const reservation = await updateReservationStatus(id, status);
    return NextResponse.json({ data: reservation });
  } catch {
    return NextResponse.json({ error: "Could not update reservation status." }, { status: 400 });
  }
}
