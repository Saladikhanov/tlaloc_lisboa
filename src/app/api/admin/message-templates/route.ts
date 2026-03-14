import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import {
  listMessageTemplates,
  saveMessageTemplates,
  type MessageTemplateRecord,
} from "@/lib/message-templates-store";

type UpdateMessageTemplatesPayload = {
  data?: Array<{
    key?: unknown;
    subjectEn?: unknown;
    subjectPt?: unknown;
    bodyEn?: unknown;
    bodyPt?: unknown;
  }>;
};

const allowedKeys = new Set<MessageTemplateRecord["key"]>([
  "reservation_new",
  "reservation_confirmed",
  "reservation_cancelled",
]);

export async function GET() {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await listMessageTemplates();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not load message templates." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as UpdateMessageTemplatesPayload | null;
  if (!payload?.data || !Array.isArray(payload.data) || payload.data.length === 0) {
    return NextResponse.json({ error: "No templates provided." }, { status: 400 });
  }

  const parsed: Omit<MessageTemplateRecord, "id">[] = [];
  for (const row of payload.data) {
    const key = typeof row.key === "string" ? (row.key as MessageTemplateRecord["key"]) : null;
    if (!key || !allowedKeys.has(key)) {
      return NextResponse.json({ error: "Invalid template key." }, { status: 400 });
    }

    const subjectEn = typeof row.subjectEn === "string" ? row.subjectEn.trim() : "";
    const subjectPt = typeof row.subjectPt === "string" ? row.subjectPt.trim() : "";
    const bodyEn = typeof row.bodyEn === "string" ? row.bodyEn : "";
    const bodyPt = typeof row.bodyPt === "string" ? row.bodyPt : "";
    if (!subjectEn || !subjectPt || !bodyEn.trim() || !bodyPt.trim()) {
      return NextResponse.json({ error: "All fields are required for each template." }, { status: 400 });
    }

    parsed.push({ key, subjectEn, subjectPt, bodyEn, bodyPt });
  }

  try {
    const data = await saveMessageTemplates(parsed);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Could not save message templates." }, { status: 500 });
  }
}
