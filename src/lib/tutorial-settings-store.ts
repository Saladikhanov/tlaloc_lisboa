import { PLACEHOLDER_EMAIL, whatsappDigits } from "@/lib/contact";
import { prisma } from "@/lib/prisma";

export type TutorialSettingsRecord = {
  id: string;
  businessPhone: string;
  businessEmail: string;
};

const DEFAULT_TUTORIAL_SETTINGS: Omit<TutorialSettingsRecord, "id"> = {
  businessPhone: "+351 933 357 555",
  businessEmail: PLACEHOLDER_EMAIL,
};

const SYNTHETIC_ID = "default";

const normalize = (
  row: { id: string; businessPhone: string; businessEmail: string } | null,
): TutorialSettingsRecord => {
  if (!row) {
    return { id: SYNTHETIC_ID, ...DEFAULT_TUTORIAL_SETTINGS };
  }

  return {
    id: row.id,
    businessPhone: row.businessPhone?.trim() || DEFAULT_TUTORIAL_SETTINGS.businessPhone,
    businessEmail: row.businessEmail?.trim() || DEFAULT_TUTORIAL_SETTINGS.businessEmail,
  };
};

export const listTutorialSettings = async (): Promise<TutorialSettingsRecord> => {
  if (!prisma) {
    return { id: SYNTHETIC_ID, ...DEFAULT_TUTORIAL_SETTINGS };
  }

  try {
    const row = await prisma.tutorialSettings.findUnique({ where: { id: SYNTHETIC_ID } });
    if (!row) {
      const seeded = await prisma.tutorialSettings.create({
        data: { id: SYNTHETIC_ID, ...DEFAULT_TUTORIAL_SETTINGS },
      });
      return normalize(seeded);
    }
    return normalize(row);
  } catch {
    return { id: SYNTHETIC_ID, ...DEFAULT_TUTORIAL_SETTINGS };
  }
};

export const saveTutorialSettings = async (
  payload: Omit<TutorialSettingsRecord, "id">,
): Promise<TutorialSettingsRecord> => {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const row = await prisma.tutorialSettings.upsert({
    where: { id: SYNTHETIC_ID },
    create: {
      id: SYNTHETIC_ID,
      businessPhone: payload.businessPhone.trim(),
      businessEmail: payload.businessEmail.trim(),
    },
    update: {
      businessPhone: payload.businessPhone.trim(),
      businessEmail: payload.businessEmail.trim(),
    },
  });

  return normalize(row);
};

export const getPublicWhatsappNumber = async (): Promise<string> =>
  whatsappDigits((await listTutorialSettings()).businessPhone);
