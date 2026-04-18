import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import {
  archiveReservationV2,
  markReservationV2AsRead,
} from "@/lib/reservation-v2-store";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data = await markReservationV2AsRead(id);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Could not mark reservation as read." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await archiveReservationV2(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not archive reservation." }, { status: 400 });
  }
}
