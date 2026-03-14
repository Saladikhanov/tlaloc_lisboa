import type { MenuCategory } from "@/lib/types";
import { menuData as fallbackMenuData } from "@/lib/menu-data";
import { prisma } from "@/lib/prisma";

const getPrisma = () => {
  if (!prisma) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return prisma;
};

const toCategory = (section: {
  id: string;
  slug: string;
  titleEn: string;
  titlePt: string;
  subtitleEn: string | null;
  subtitlePt: string | null;
  items: {
    id: string;
    nameEn: string;
    namePt: string;
    descriptionEn: string;
    descriptionPt: string;
    price: string;
    vegetarian: boolean;
  }[];
}): MenuCategory => ({
  id: section.slug,
  title: {
    en: section.titleEn,
    pt: section.titlePt,
  },
  subtitle:
    section.subtitleEn || section.subtitlePt
      ? {
          en: section.subtitleEn ?? "",
          pt: section.subtitlePt ?? section.subtitleEn ?? "",
        }
      : undefined,
  items: section.items.map((item) => ({
    name: { en: item.nameEn, pt: item.namePt },
    description: { en: item.descriptionEn, pt: item.descriptionPt },
    price: item.price,
    vegetarian: item.vegetarian || undefined,
  })),
});

export async function ensureMenuSeeded(): Promise<void> {
  const db = getPrisma();
  const count = await db.menuSection.count();
  if (count > 0) {
    return;
  }

  await db.$transaction(
    fallbackMenuData.map((section, sectionIndex) =>
      db.menuSection.create({
        data: {
          slug: section.id,
          titleEn: section.title.en,
          titlePt: section.title.pt,
          subtitleEn: section.subtitle?.en,
          subtitlePt: section.subtitle?.pt,
          order: sectionIndex,
          items: {
            create: section.items.map((item, itemIndex) => ({
              nameEn: item.name.en,
              namePt: item.name.pt,
              descriptionEn: item.description.en,
              descriptionPt: item.description.pt,
              price: item.price,
              vegetarian: Boolean(item.vegetarian),
              order: itemIndex,
            })),
          },
        },
      }),
    ),
  );
}

export async function getMenuData(): Promise<MenuCategory[]> {
  if (!prisma) {
    return fallbackMenuData;
  }

  try {
    await ensureMenuSeeded();
    const sections = await prisma.menuSection.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        items: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return sections.map(toCategory);
  } catch {
    // Keep public menu available even if DB is temporarily unreachable at build/runtime.
    return fallbackMenuData;
  }
}

export async function getAdminMenuData() {
  const db = getPrisma();
  await ensureMenuSeeded();
  return db.menuSection.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      items: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}
