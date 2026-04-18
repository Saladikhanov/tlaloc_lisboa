import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { redeemRewardCode } from "@/lib/reward-store";

type Payload = {
  code?: unknown;
  phone?: unknown;
  email?: unknown;
  reservationId?: unknown;
  reservationVersion?: unknown;
};

export async function POST(request: Request) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Payload | null;
  const code = typeof payload?.code === "string" ? payload.code.trim() : "";

  if (!code) {
    return NextResponse.json({ error: "Code is required." }, { status: 400 });
  }

  try {
    const data = await redeemRewardCode({
      code,
      phone: typeof payload?.phone === "string" ? payload.phone : undefined,
      email: typeof payload?.email === "string" ? payload.email : undefined,
      reservationId: typeof payload?.reservationId === "string" ? payload.reservationId : undefined,
      reservationVersion:
        payload?.reservationVersion === "v1" || payload?.reservationVersion === "v2"
          ? payload.reservationVersion
          : undefined,
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not redeem reward code." }, { status: 500 });
  }
}
