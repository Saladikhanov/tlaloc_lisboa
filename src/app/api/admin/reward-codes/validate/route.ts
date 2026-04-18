import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { validateRewardCode } from "@/lib/reward-store";

type Payload = {
  code?: unknown;
  phone?: unknown;
  email?: unknown;
};

export async function POST(request: Request) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Payload | null;
  const code = typeof payload?.code === "string" ? payload.code.trim() : "";
  const phone = typeof payload?.phone === "string" ? payload.phone : undefined;
  const email = typeof payload?.email === "string" ? payload.email : undefined;

  if (!code) {
    return NextResponse.json({ error: "Code is required." }, { status: 400 });
  }

  try {
    const data = await validateRewardCode({ code, phone, email });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not validate reward code." }, { status: 500 });
  }
}
