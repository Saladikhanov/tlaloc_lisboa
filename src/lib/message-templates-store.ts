import type { ReservationRecord } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export type MessageTemplateRecord = {
  id: string;
  key: "reservation_new" | "reservation_confirmed" | "reservation_cancelled";
  subjectEn: string;
  subjectPt: string;
  bodyEn: string;
  bodyPt: string;
};

const defaultTemplates: Omit<MessageTemplateRecord, "id">[] = [
  {
    key: "reservation_new",
    subjectEn: "We received your reservation request",
    subjectPt: "Recebemos o seu pedido de reserva",
    bodyEn:
      "Hi {firstName},\nWe received your reservation request.\nDate: {date}\nTime: {time}\nGuests: {guests}\nWe will confirm shortly.\nTlaloc Restaurant",
    bodyPt:
      "Ola {firstName},\nRecebemos o seu pedido de reserva.\nData: {date}\nHora: {time}\nPessoas: {guests}\nVamos confirmar em breve.\nTlaloc Restaurant",
  },
  {
    key: "reservation_confirmed",
    subjectEn: "Reservation confirmed - Tlaloc Restaurant",
    subjectPt: "Reserva confirmada - Tlaloc Restaurant",
    bodyEn:
      "Hi {firstName},\nYour reservation is confirmed.\nDate: {date}\nTime: {time}\nGuests: {guests}\nSee you soon!\nTlaloc Restaurant",
    bodyPt:
      "Ola {firstName},\nA sua reserva foi confirmada.\nData: {date}\nHora: {time}\nPessoas: {guests}\nAte breve!\nTlaloc Restaurant",
  },
  {
    key: "reservation_cancelled",
    subjectEn: "We could not confirm your reservation",
    subjectPt: "Nao conseguimos confirmar a reserva",
    bodyEn:
      "Hi {firstName},\nWe are sorry, but we could not confirm your reservation.\nDate: {date}\nTime: {time}\nGuests: {guests}\nPlease share another date/time and we will gladly assist.\nTlaloc Restaurant",
    bodyPt:
      "Ola {firstName},\nPedimos desculpa, mas nao conseguimos confirmar a sua reserva.\nData: {date}\nHora: {time}\nPessoas: {guests}\nSe quiser, envie-nos outra data/hora.\nTlaloc Restaurant",
  },
];

const normalizeTemplates = (rows: MessageTemplateRecord[]): MessageTemplateRecord[] => {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return defaultTemplates.map((fallback) => {
    const found = byKey.get(fallback.key);
    return (
      found ?? {
        id: `default-${fallback.key}`,
        ...fallback,
      }
    );
  });
};

export const ensureMessageTemplatesSeeded = async (): Promise<void> => {
  if (!prisma) {
    return;
  }

  for (const row of defaultTemplates) {
    await prisma.messageTemplate.upsert({
      where: { key: row.key },
      create: row,
      update: {},
    });
  }
};

export const listMessageTemplates = async (): Promise<MessageTemplateRecord[]> => {
  if (!prisma) {
    return normalizeTemplates([]);
  }

  try {
    await ensureMessageTemplatesSeeded();
    const rows = await prisma.messageTemplate.findMany();
    return normalizeTemplates(
      rows.map((row) => ({
        id: row.id,
        key: row.key as MessageTemplateRecord["key"],
        subjectEn: row.subjectEn,
        subjectPt: row.subjectPt,
        bodyEn: row.bodyEn,
        bodyPt: row.bodyPt,
      })),
    );
  } catch {
    return normalizeTemplates([]);
  }
};

export const saveMessageTemplates = async (
  templates: Omit<MessageTemplateRecord, "id">[],
): Promise<MessageTemplateRecord[]> => {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }
  const db = prisma;

  await db.$transaction(
    templates.map((row) =>
      db.messageTemplate.upsert({
        where: { key: row.key },
        create: row,
        update: {
          subjectEn: row.subjectEn,
          subjectPt: row.subjectPt,
          bodyEn: row.bodyEn,
          bodyPt: row.bodyPt,
        },
      }),
    ),
  );

  return listMessageTemplates();
};

export const getMessageTemplateForReservation = (
  templates: MessageTemplateRecord[],
  reservation: ReservationRecord,
): MessageTemplateRecord => {
  const key =
    reservation.status === "confirmed"
      ? "reservation_confirmed"
      : reservation.status === "cancelled"
        ? "reservation_cancelled"
        : "reservation_new";

  return (
    templates.find((template) => template.key === key) ??
    normalizeTemplates([]).find((template) => template.key === key)!
  );
};

export const renderTemplateWithReservation = (
  templateValue: string,
  reservation: ReservationRecord,
  locale: "en" | "pt",
): string => {
  const variables: Record<string, string> = {
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    fullName: `${reservation.firstName} ${reservation.lastName}`.trim(),
    date: reservation.date,
    time: reservation.time,
    guests: reservation.guests,
    phone: reservation.phone,
    email: reservation.email,
    occasion: reservation.occasion ?? "-",
    notes: reservation.notes ?? "-",
    status: reservation.status,
    locale,
  };

  return templateValue.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, name: string) => {
    return variables[name] ?? "";
  });
};
