import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";

type CreateItemPayload = {
  sectionId?: unknown;
  nameEn?: unknown;
  namePt?: unknown;
  descriptionEn?: unknown;
  descriptionPt?: unknown;
  price?: unknown;
  vegetarian?: unknown;
};

export async function POST(request: Request) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as CreateItemPayload | null;
  const sectionId = typeof payload?.sectionId === "string" ? payload.sectionId : "";
  const nameEn = typeof payload?.nameEn === "string" ? payload.nameEn.trim() : "";
  const namePt = typeof payload?.namePt === "string" ? payload.namePt.trim() : "";
  const descriptionEn =
    typeof payload?.descriptionEn === "string" ? payload.descriptionEn.trim() : "";
  const descriptionPt =
    typeof payload?.descriptionPt === "string" ? payload.descriptionPt.trim() : "";
  const price = typeof payload?.price === "string" ? payload.price.trim() : "";
  const vegetarian = payload?.vegetarian === true;

  if (!sectionId || !nameEn || !namePt || !descriptionEn || !descriptionPt || !price) {
    return NextResponse.json({ error: "Missing required item fields." }, { status: 400 });
  }

  const section = await prisma.menuSection.findUnique({ where: { id: sectionId } });
  if (!section) {
    return NextResponse.json({ error: "Section not found." }, { status: 404 });
  }

  const order = await prisma.menuItem.count({ where: { sectionId } });
  const item = await prisma.menuItem.create({
    data: {
      sectionId,
      nameEn,
      namePt,
      descriptionEn,
      descriptionPt,
      price,
      vegetarian,
      order,
    },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
