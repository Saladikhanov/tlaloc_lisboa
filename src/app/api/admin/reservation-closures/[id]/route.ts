import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { deleteReservationClosure } from "@/lib/reservation-closure-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteReservationClosure(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Could not delete reservation closure:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete reservation closure.",
      },
      { status: 500 },
    );
  }
}
