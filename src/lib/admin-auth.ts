import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const ADMIN_SESSION_COOKIE = "tlaloc_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const KEY_LENGTH = 64;
const scrypt = promisify(scryptCallback);

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "dev-admin-session-secret-change-me";
}

function safeEqual(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(valueBuffer, expectedBuffer);
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_SESSION_SECRET || process.env.NODE_ENV !== "production");
}

export function createAdminSessionToken(): string {
  const expiresAtSeconds = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const payload = `admin:${expiresAtSeconds}`;
  const signature = signPayload(payload, getSessionSecret());
  return `${expiresAtSeconds}.${signature}`;
}

export function verifyAdminSessionToken(token?: string): boolean {
  if (!token) {
    return false;
  }

  const [expiresAtRaw, signature] = token.split(".");
  const expiresAtSeconds = Number(expiresAtRaw);

  if (!expiresAtRaw || !signature || !Number.isFinite(expiresAtSeconds)) {
    return false;
  }

  if (expiresAtSeconds <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expectedSignature = signPayload(`admin:${expiresAtRaw}`, getSessionSecret());
  return safeEqual(signature, expectedSignature);
}

export function getAdminSessionCookieName(): string {
  return ADMIN_SESSION_COOKIE;
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(":");
  if (!salt || !key) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return safeEqual(derivedKey.toString("hex"), key);
}
