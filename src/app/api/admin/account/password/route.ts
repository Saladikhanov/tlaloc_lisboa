import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { changeAdminPassword } from "@/lib/admin-user-store";

type Payload = {
  username?: unknown;
  currentPassword?: unknown;
  nextPassword?: unknown;
};

export async function PATCH(request: Request) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Payload | null;
  const username = typeof payload?.username === "string" ? payload.username.trim() : "";
  const currentPassword =
    typeof payload?.currentPassword === "string" ? payload.currentPassword : "";
  const nextPassword = typeof payload?.nextPassword === "string" ? payload.nextPassword : "";

  if (!username || !currentPassword || !nextPassword || nextPassword.length < 6) {
    return NextResponse.json(
      { error: "username, currentPassword and nextPassword (min 6 chars) are required." },
      { status: 400 },
    );
  }

  const ok = await changeAdminPassword(username, currentPassword, nextPassword);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid credentials or user not found." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
