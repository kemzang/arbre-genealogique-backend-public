import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const rawEnvUrl = process.env.DATABASE_URL;
// sanitize: remove surrounding quotes, all whitespace/newlines, and control chars
const dbUrl = rawEnvUrl
  ? rawEnvUrl
      .replace(/^['"]+|['"]+$/g, "")
      .replace(/[\r\n\t\0\f\v]+/g, "")
      .trim()
  : undefined;
if (dbUrl) console.log("Prisma DB URL (sanitized):", dbUrl);

let adapter: PrismaMariaDb | undefined;
if (dbUrl) {
  try {
    adapter = new PrismaMariaDb(dbUrl);
  } catch (err) {
    console.error("Failed to create PrismaMariaDb adapter with DB URL:", dbUrl);
    console.error(err);
    // rethrow so startup fails with a clear message
    throw err;
  }
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    adapter
      ? ({ adapter } as unknown as Prisma.PrismaClientOptions)
      : undefined,
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
