import { createHmac, timingSafeEqual } from "node:crypto";

const CONFIRM_TTL_SECONDS = 60 * 60 * 24; // 24 hours

function getSecret(): string {
  return (
    process.env.RESERVATION_CONFIRM_SECRET ??
    process.env.ADMIN_SESSION_SECRET ??
    "dev-confirm-secret-change-me"
  );
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function safeEqual(value: string, expected: string): boolean {
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

function resolveAppBaseUrl(): string {
  const candidate =
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return candidate.endsWith("/") ? candidate.slice(0, -1) : candidate;
}

export function createReservationConfirmToken(reservationId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + CONFIRM_TTL_SECONDS;
  const payload = `${reservationId}.${expiresAt}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifyReservationConfirmToken(token?: string): string | null {
  if (!token) {
    return null;
  }

  const [reservationId, expiresAtRaw, signature] = token.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (!reservationId || !expiresAtRaw || !signature || !Number.isFinite(expiresAt)) {
    return null;
  }

  if (expiresAt <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  const expected = sign(`${reservationId}.${expiresAtRaw}`);
  if (!safeEqual(signature, expected)) {
    return null;
  }

  return reservationId;
}

export function createReservationConfirmUrl(reservationId: string): string {
  const token = createReservationConfirmToken(reservationId);
  return `${resolveAppBaseUrl()}/api/reservations/confirm?token=${encodeURIComponent(token)}`;
}
