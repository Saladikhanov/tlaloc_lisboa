import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequestAuthenticated } from "@/lib/admin-request";

type CreateSectionPayload = {
  slug?: unknown;
  titleEn?: unknown;
  titlePt?: unknown;
  subtitleEn?: unknown;
  subtitlePt?: unknown;
};

export async function POST(request: Request) {
  if (!(await isAdminRequestAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as CreateSectionPayload | null;
  const slug = typeof payload?.slug === "string" ? payload.slug.trim().toLowerCase() : "";
  const titleEn = typeof payload?.titleEn === "string" ? payload.titleEn.trim() : "";
  const titlePt = typeof payload?.titlePt === "string" ? payload.titlePt.trim() : "";
  const subtitleEn =
    typeof payload?.subtitleEn === "string" ? payload.subtitleEn.trim() || null : null;
  const subtitlePt =
    typeof payload?.subtitlePt === "string" ? payload.subtitlePt.trim() || null : null;

  if (!slug || !titleEn || !titlePt) {
    return NextResponse.json(
      { error: "slug, titleEn and titlePt are required." },
      { status: 400 },
    );
  }

  const order = await prisma.menuSection.count();
  try {
    const section = await prisma.menuSection.create({
      data: { slug, titleEn, titlePt, subtitleEn, subtitlePt, order },
    });
    return NextResponse.json({ data: section }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not create section. slug may already exist." },
      { status: 400 },
    );
  }
}
