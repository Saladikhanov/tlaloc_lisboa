import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";

type UpdateItemPayload = {
  nameEn?: unknown;
  namePt?: unknown;
  descriptionEn?: unknown;
  descriptionPt?: unknown;
  price?: unknown;
  vegetarian?: unknown;
  order?: unknown;
  sectionId?: unknown;
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
  const payload = (await request.json().catch(() => null)) as UpdateItemPayload | null;
  const data: {
    nameEn?: string;
    namePt?: string;
    descriptionEn?: string;
    descriptionPt?: string;
    price?: string;
    vegetarian?: boolean;
    order?: number;
    sectionId?: string;
  } = {};

  if (typeof payload?.nameEn === "string") data.nameEn = payload.nameEn.trim();
  if (typeof payload?.namePt === "string") data.namePt = payload.namePt.trim();
  if (typeof payload?.descriptionEn === "string") data.descriptionEn = payload.descriptionEn.trim();
  if (typeof payload?.descriptionPt === "string") data.descriptionPt = payload.descriptionPt.trim();
  if (typeof payload?.price === "string") data.price = payload.price.trim();
  if (typeof payload?.vegetarian === "boolean") data.vegetarian = payload.vegetarian;
  if (typeof payload?.order === "number" && Number.isFinite(payload.order)) data.order = payload.order;
  if (typeof payload?.sectionId === "string") data.sectionId = payload.sectionId;

  try {
    const item = await prisma.menuItem.update({ where: { id }, data });
    return NextResponse.json({ data: item });
  } catch {
    return NextResponse.json({ error: "Could not update item." }, { status: 400 });
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
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete item." }, { status: 400 });
  }
}
