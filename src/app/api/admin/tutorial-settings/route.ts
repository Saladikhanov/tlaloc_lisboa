import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { listTutorialSettings, saveTutorialSettings } from "@/lib/tutorial-settings-store";

type UpdateTutorialSettingsPayload = {
  businessPhone?: unknown;
  businessEmail?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await listTutorialSettings();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not load tutorial settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as UpdateTutorialSettingsPayload | null;
  const businessPhone =
    typeof payload?.businessPhone === "string" ? payload.businessPhone.trim() : "";
  const businessEmail =
    typeof payload?.businessEmail === "string" ? payload.businessEmail.trim() : "";

  if (!businessPhone) {
    return NextResponse.json({ error: "Business WhatsApp number is required." }, { status: 400 });
  }

  if (!businessEmail || !emailPattern.test(businessEmail)) {
    return NextResponse.json({ error: "Valid business email is required." }, { status: 400 });
  }

  try {
    const data = await saveTutorialSettings({ businessPhone, businessEmail });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not save tutorial settings." }, { status: 500 });
  }
}
