import type {
  Prisma,
  Reservation,
  ReservationV2,
  RewardCode,
  RewardProgramSettings,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  Locale,
  ReservationLifecycleStatus,
  RewardCodeRecord,
  RewardCodeValidationResult,
  RewardProgramSettingsRecord,
  RewardType,
} from "@/lib/types";

const DEFAULT_SETTINGS = {
  id: "default",
  isEnabled: false,
  visitThreshold: 3,
  rewardType: "percent" as RewardType,
  rewardValue: "10",
  rewardLabel: "10% off",
  messageEn:
    "Here is your Tlaloc promo code: {code}. Use it for {rewardLabel} on your next visit.",
  messagePt:
    "Aqui esta o seu codigo promocional Tlaloc: {code}. Use-o para {rewardLabel} na sua proxima visita.",
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type RewardReservationIdentity = {
  version: "v1" | "v2";
  id: string;
  locale: Locale;
  status: ReservationLifecycleStatus;
  phone: string;
  email: string;
  guestName: string;
};

const getPrisma = () => {
  if (!prisma) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return prisma;
};

const normalizePhoneKey = (phone: string | null | undefined): string | undefined => {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  return digits || undefined;
};

const normalizeEmailKey = (email: string | null | undefined): string | undefined => {
  const normalized = (email ?? "").trim().toLowerCase();
  return normalized || undefined;
};

const toSettingsRecord = (row: RewardProgramSettings): RewardProgramSettingsRecord => ({
  id: row.id,
  isEnabled: row.isEnabled,
  visitThreshold: row.visitThreshold,
  rewardType: row.rewardType,
  rewardValue: row.rewardValue,
  rewardLabel: row.rewardLabel,
  messageEn: row.messageEn ?? undefined,
  messagePt: row.messagePt ?? undefined,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const toRewardCodeRecord = (row: RewardCode): RewardCodeRecord => ({
  id: row.id,
  code: row.code,
  status: row.status,
  phoneKey: row.phoneKey ?? undefined,
  emailKey: row.emailKey ?? undefined,
  guestName: row.guestName ?? undefined,
  rewardType: row.rewardType,
  rewardValue: row.rewardValue,
  rewardLabel: row.rewardLabel,
  messageEn: row.messageEn ?? undefined,
  messagePt: row.messagePt ?? undefined,
  generatedAfterConfirmedCount: row.generatedAfterConfirmedCount,
  originReservationId: row.originReservationId ?? undefined,
  originReservationVersion: row.originReservationVersion as "v1" | "v2" | undefined,
  usedByReservationId: row.usedByReservationId ?? undefined,
  usedByReservationVersion: row.usedByReservationVersion as "v1" | "v2" | undefined,
  usedAt: row.usedAt?.toISOString(),
  cancelledAt: row.cancelledAt?.toISOString(),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const buildRewardMessage = (
  template: string | undefined,
  rewardLabel: string,
  code: string,
): string => (template ?? "").replace(/\{code\}/g, code).replace(/\{rewardLabel\}/g, rewardLabel);

const getRewardCodeIdentityMatch = (
  row: RewardCode,
  phoneKey?: string,
  emailKey?: string,
): boolean => {
  if (!phoneKey && !emailKey) {
    return true;
  }
  return row.phoneKey === phoneKey || row.emailKey === emailKey;
};

const toReservationIdentityFromV1 = (reservation: Reservation): RewardReservationIdentity => ({
  version: "v1",
  id: reservation.id,
  locale: reservation.locale,
  status: reservation.status as ReservationLifecycleStatus,
  phone: reservation.phone,
  email: reservation.email,
  guestName: `${reservation.firstName} ${reservation.lastName}`.trim(),
});

const toReservationIdentityFromV2 = (reservation: ReservationV2): RewardReservationIdentity => ({
  version: "v2",
  id: reservation.id,
  locale: reservation.locale,
  status: reservation.status as ReservationLifecycleStatus,
  phone: reservation.phone,
  email: reservation.email ?? "",
  guestName: reservation.fullName,
});

const listAllReservationIdentities = async (): Promise<RewardReservationIdentity[]> => {
  const db = getPrisma();
  const [v1, v2] = await Promise.all([
    db.reservation.findMany(),
    db.reservationV2.findMany({ where: { archivedAt: null } }),
  ]);

  return [...v1.map(toReservationIdentityFromV1), ...v2.map(toReservationIdentityFromV2)];
};

const getClusterIdentities = (
  reservations: RewardReservationIdentity[],
  phoneKey?: string,
  emailKey?: string,
): { phoneKeys: string[]; emailKeys: string[]; reservations: RewardReservationIdentity[] } => {
  const queuePhone = new Set<string>();
  const queueEmail = new Set<string>();
  const matchedReservationIds = new Set<string>();

  if (phoneKey) {
    queuePhone.add(phoneKey);
  }
  if (emailKey) {
    queueEmail.add(emailKey);
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const reservation of reservations) {
      const reservationPhoneKey = normalizePhoneKey(reservation.phone);
      const reservationEmailKey = normalizeEmailKey(reservation.email);
      const matches =
        (reservationPhoneKey && queuePhone.has(reservationPhoneKey)) ||
        (reservationEmailKey && queueEmail.has(reservationEmailKey));

      if (!matches) {
        continue;
      }

      const compositeId = `${reservation.version}:${reservation.id}`;
      if (matchedReservationIds.has(compositeId)) {
        continue;
      }

      matchedReservationIds.add(compositeId);
      if (reservationPhoneKey && !queuePhone.has(reservationPhoneKey)) {
        queuePhone.add(reservationPhoneKey);
        changed = true;
      }
      if (reservationEmailKey && !queueEmail.has(reservationEmailKey)) {
        queueEmail.add(reservationEmailKey);
        changed = true;
      }
    }
  }

  return {
    phoneKeys: [...queuePhone],
    emailKeys: [...queueEmail],
    reservations: reservations.filter((reservation) =>
      matchedReservationIds.has(`${reservation.version}:${reservation.id}`),
    ),
  };
};

const createRandomCode = (): string => {
  let value = "";
  for (let index = 0; index < 8; index += 1) {
    value += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return value;
};

const createUniqueRewardCode = async (): Promise<string> => {
  const db = getPrisma();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = createRandomCode();
    const existing = await db.rewardCode.findUnique({ where: { code } });
    if (!existing) {
      return code;
    }
  }
  throw new Error("Could not generate unique reward code.");
};

export const getRewardProgramSettings = async (): Promise<RewardProgramSettingsRecord> => {
  const db = getPrisma();
  const row = await db.rewardProgramSettings.upsert({
    where: { id: DEFAULT_SETTINGS.id },
    create: DEFAULT_SETTINGS,
    update: {},
  });
  return toSettingsRecord(row);
};

export const updateRewardProgramSettings = async (
  payload: Partial<{
    isEnabled: boolean;
    visitThreshold: number;
    rewardType: RewardType;
    rewardValue: string;
    rewardLabel: string;
    messageEn: string;
    messagePt: string;
  }>,
): Promise<RewardProgramSettingsRecord> => {
  const db = getPrisma();
  const row = await db.rewardProgramSettings.upsert({
    where: { id: DEFAULT_SETTINGS.id },
    create: {
      ...DEFAULT_SETTINGS,
      ...payload,
      rewardValue: payload.rewardValue?.trim() || DEFAULT_SETTINGS.rewardValue,
      rewardLabel: payload.rewardLabel?.trim() || DEFAULT_SETTINGS.rewardLabel,
      messageEn: payload.messageEn?.trim() || DEFAULT_SETTINGS.messageEn,
      messagePt: payload.messagePt?.trim() || DEFAULT_SETTINGS.messagePt,
    },
    update: {
      isEnabled: payload.isEnabled,
      visitThreshold:
        typeof payload.visitThreshold === "number" && payload.visitThreshold > 0
          ? payload.visitThreshold
          : undefined,
      rewardType: payload.rewardType,
      rewardValue: payload.rewardValue?.trim() || undefined,
      rewardLabel: payload.rewardLabel?.trim() || undefined,
      messageEn: payload.messageEn?.trim() || undefined,
      messagePt: payload.messagePt?.trim() || undefined,
    },
  });
  return toSettingsRecord(row);
};

export const listRewardCodes = async (): Promise<RewardCodeRecord[]> => {
  const rows = await getPrisma().rewardCode.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRewardCodeRecord);
};

export const deleteRedeemedRewardCodes = async (): Promise<number> => {
  const result = await getPrisma().rewardCode.deleteMany({
    where: { status: "used" },
  });
  return result.count;
};

export const getRewardCodeByCode = async (code: string): Promise<RewardCodeRecord | null> => {
  const row = await getPrisma().rewardCode.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  return row ? toRewardCodeRecord(row) : null;
};

const cancelActiveCodesForCluster = async (
  tx: Prisma.TransactionClient,
  phoneKeys: string[],
  emailKeys: string[],
): Promise<void> => {
  await tx.rewardCode.updateMany({
    where: {
      status: "active",
      OR: [
        ...(phoneKeys.length > 0 ? [{ phoneKey: { in: phoneKeys } }] : []),
        ...(emailKeys.length > 0 ? [{ emailKey: { in: emailKeys } }] : []),
      ],
    },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });
};

const cancelAllActiveRewardCodes = async (): Promise<void> => {
  await getPrisma().rewardCode.updateMany({
    where: { status: "active" },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });
};

const findReservationIdentity = async (
  version: "v1" | "v2",
  reservationId: string,
): Promise<RewardReservationIdentity | null> => {
  const db = getPrisma();
  if (version === "v1") {
    const reservation = await db.reservation.findUnique({ where: { id: reservationId } });
    return reservation ? toReservationIdentityFromV1(reservation) : null;
  }

  const reservation = await db.reservationV2.findUnique({ where: { id: reservationId } });
  return reservation ? toReservationIdentityFromV2(reservation) : null;
};

export const syncRewardCodesForReservation = async (
  version: "v1" | "v2",
  reservationId: string,
): Promise<void> => {
  const db = getPrisma();
  const [settings, triggerReservation, allReservations] = await Promise.all([
    getRewardProgramSettings(),
    findReservationIdentity(version, reservationId),
    listAllReservationIdentities(),
  ]);

  if (!triggerReservation) {
    return;
  }

  const cluster = getClusterIdentities(
    allReservations,
    normalizePhoneKey(triggerReservation.phone),
    normalizeEmailKey(triggerReservation.email),
  );
  if (cluster.phoneKeys.length === 0 && cluster.emailKeys.length === 0) {
    return;
  }

  const confirmedCount = cluster.reservations.filter((reservation) => reservation.status === "confirmed").length;

  await db.$transaction(async (tx) => {
    const activeCodes = await tx.rewardCode.findMany({
      where: {
        status: "active",
        OR: [
          ...(cluster.phoneKeys.length > 0 ? [{ phoneKey: { in: cluster.phoneKeys } }] : []),
          ...(cluster.emailKeys.length > 0 ? [{ emailKey: { in: cluster.emailKeys } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!settings.isEnabled || confirmedCount < settings.visitThreshold) {
      if (activeCodes.length > 0) {
        await cancelActiveCodesForCluster(tx, cluster.phoneKeys, cluster.emailKeys);
      }
      return;
    }

    if (activeCodes.length > 1) {
      const [, ...rest] = activeCodes;
      await tx.rewardCode.updateMany({
        where: { id: { in: rest.map((row) => row.id) } },
        data: { status: "cancelled", cancelledAt: new Date() },
      });
    }

    if (activeCodes.length >= 1) {
      return;
    }

    const code = await createUniqueRewardCode();
    await tx.rewardCode.create({
      data: {
        code,
        status: "active",
        phoneKey: cluster.phoneKeys[0] ?? null,
        emailKey: cluster.emailKeys[0] ?? null,
        guestName: triggerReservation.guestName,
        rewardType: settings.rewardType,
        rewardValue: settings.rewardValue,
        rewardLabel: settings.rewardLabel,
        messageEn: buildRewardMessage(settings.messageEn, settings.rewardLabel, code),
        messagePt: buildRewardMessage(settings.messagePt, settings.rewardLabel, code),
        generatedAfterConfirmedCount: confirmedCount,
        originReservationId: reservationId,
        originReservationVersion: version,
      },
    });
  });
};

export const syncRewardCodesForAllGuests = async (): Promise<void> => {
  const settings = await getRewardProgramSettings();
  if (!settings.isEnabled) {
    await cancelAllActiveRewardCodes();
    return;
  }

  const allReservations = await listAllReservationIdentities();
  const processedKeys = new Set<string>();

  for (const reservation of allReservations) {
    const phoneKey = normalizePhoneKey(reservation.phone);
    const emailKey = normalizeEmailKey(reservation.email);
    const cluster = getClusterIdentities(allReservations, phoneKey, emailKey);
    const signature = JSON.stringify({
      phoneKeys: [...cluster.phoneKeys].sort(),
      emailKeys: [...cluster.emailKeys].sort(),
    });
    if (processedKeys.has(signature)) {
      continue;
    }
    processedKeys.add(signature);
    await syncRewardCodesForReservation(reservation.version, reservation.id);
  }
};

export const validateRewardCode = async (payload: {
  code: string;
  phone?: string;
  email?: string;
}): Promise<RewardCodeValidationResult> => {
  const settings = await getRewardProgramSettings();
  const db = getPrisma();
  const normalizedCode = payload.code.trim().toUpperCase();
  const row = await db.rewardCode.findUnique({ where: { code: normalizedCode } });

  if (!row) {
    return {
      code: {
        id: "",
        code: normalizedCode,
        status: "cancelled",
        rewardType: "custom",
        rewardValue: "",
        rewardLabel: "",
        generatedAfterConfirmedCount: 0,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      },
      isValid: false,
      reason: "not_found",
    };
  }

  if (!settings.isEnabled || row.status !== "active") {
    return { code: toRewardCodeRecord(row), isValid: false, reason: "inactive" };
  }

  const phoneKey = normalizePhoneKey(payload.phone);
  const emailKey = normalizeEmailKey(payload.email);
  if (!getRewardCodeIdentityMatch(row, phoneKey, emailKey)) {
    return { code: toRewardCodeRecord(row), isValid: false, reason: "identity_mismatch" };
  }

  return { code: toRewardCodeRecord(row), isValid: true };
};

export const redeemRewardCode = async (payload: {
  code: string;
  reservationId?: string;
  reservationVersion?: "v1" | "v2";
  phone?: string;
  email?: string;
}): Promise<RewardCodeValidationResult> => {
  const validation = await validateRewardCode({
    code: payload.code,
    phone: payload.phone,
    email: payload.email,
  });

  if (!validation.isValid) {
    return validation;
  }

  const row = await getPrisma().rewardCode.update({
    where: { code: payload.code.trim().toUpperCase() },
    data: {
      status: "used",
      usedAt: new Date(),
      usedByReservationId: payload.reservationId ?? null,
      usedByReservationVersion: payload.reservationVersion ?? null,
    },
  });

  return { code: toRewardCodeRecord(row), isValid: true };
};
