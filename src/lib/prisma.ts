import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | null;
};

const connectionString = process.env.DATABASE_URL;

const createPrismaClient = (): PrismaClient | null =>
  connectionString
    ? new PrismaClient({
        adapter: new PrismaPg({ connectionString }),
        log:
          process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      })
    : null;

const hasRequiredReservationModels = (client: PrismaClient | null | undefined): boolean => {
  if (!client) {
    return false;
  }

  const modelClient = client as unknown as Record<string, unknown>;
  return (
    "reservationClosure" in modelClient &&
    "reservationV2" in modelClient &&
    "rewardProgramSettings" in modelClient &&
    "rewardCode" in modelClient
  );
};

export const prisma =
  hasRequiredReservationModels(globalForPrisma.prisma)
    ? globalForPrisma.prisma!
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
