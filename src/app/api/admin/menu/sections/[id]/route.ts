import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";

type UpdateSectionPayload = {
  slug?: unknown;
  titleEn?: unknown;
  titlePt?: unknown;
  subtitleEn?: unknown;
  subtitlePt?: unknown;
  order?: unknown;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const { id } = await params;
  const payload = (await request.json().catch(() => null)) as UpdateSectionPayload | null;

  const data: {
    slug?: string;
    titleEn?: string;
    titlePt?: string;
    subtitleEn?: string | null;
    subtitlePt?: string | null;
    order?: number;
  } = {};

  if (typeof payload?.slug === "string") data.slug = payload.slug.trim().toLowerCase();
  if (typeof payload?.titleEn === "string") data.titleEn = payload.titleEn.trim();
  if (typeof payload?.titlePt === "string") data.titlePt = payload.titlePt.trim();
  if (typeof payload?.subtitleEn === "string") data.subtitleEn = payload.subtitleEn.trim() || null;
  if (typeof payload?.subtitlePt === "string") data.subtitlePt = payload.subtitlePt.trim() || null;
  if (typeof payload?.order === "number" && Number.isFinite(payload.order)) data.order = payload.order;

  try {
    const section = await prisma.menuSection.update({ where: { id }, data });
    return NextResponse.json({ data: section });
  } catch {
    return NextResponse.json({ error: "Could not update section." }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const { id } = await params;
  try {
    await prisma.menuSection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete section." }, { status: 400 });
  }
}
