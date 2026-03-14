import { NextResponse } from "next/server";
import {
  createAdminSessionToken,
  getAdminSessionCookieName,
  getAdminSessionCookieOptions,
  isAdminAuthConfigured,
} from "@/lib/admin-auth";
import { ensureBootstrapAdmin, validateAdminLogin } from "@/lib/admin-user-store";

type LoginPayload = {
  username?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: "Admin auth is not configured. Set ADMIN_SESSION_SECRET." },
      { status: 500 },
    );
  }

  const payload = (await request.json().catch(() => null)) as LoginPayload | null;
  const username = typeof payload?.username === "string" ? payload.username.trim() : "";
  const password = typeof payload?.password === "string" ? payload.password : "";

  try {
    await ensureBootstrapAdmin();

    if (!(await validateAdminLogin(username, password))) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }
  } catch {
    return NextResponse.json(
      { error: "Could not validate login. Check database connection." },
      { status: 500 },
    );
  }

  const token = createAdminSessionToken();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAdminSessionCookieName(), token, getAdminSessionCookieOptions());
  return response;
}
