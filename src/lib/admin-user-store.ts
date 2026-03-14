import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/admin-auth";

const getPrisma = () => {
  if (!prisma) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return prisma;
};

export async function ensureBootstrapAdmin(): Promise<void> {
  const db = getPrisma();
  const count = await db.adminUser.count();
  if (count > 0) {
    return;
  }

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return;
  }

  await db.adminUser.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
    },
  });
}

export async function validateAdminLogin(
  username: string,
  password: string,
): Promise<boolean> {
  const db = getPrisma();
  const user = await db.adminUser.findUnique({ where: { username } });
  if (!user) {
    return false;
  }

  return verifyPassword(password, user.passwordHash);
}

export async function changeAdminPassword(
  username: string,
  currentPassword: string,
  nextPassword: string,
): Promise<boolean> {
  const db = getPrisma();
  const user = await db.adminUser.findUnique({ where: { username } });
  if (!user) {
    return false;
  }

  const currentMatches = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentMatches) {
    return false;
  }

  await db.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(nextPassword) },
  });

  return true;
}
