import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

const rawEnvUrl = process.env.DATABASE_URL;
// sanitize: remove surrounding quotes, all whitespace/newlines, and control chars
let dbUrl = rawEnvUrl
  ? rawEnvUrl
      .replace(/^['"]+|['"]+$/g, "")
      .replace(/[\r\n\t\0\f\v]+/g, "")
      .trim()
  : undefined;

// Optional: normalize postgres URL (e.g. postgres:// → postgresql:// for Prisma)
if (dbUrl && dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://")) {
  dbUrl = dbUrl.replace("postgres://", "postgresql://");
}

// Override environment variable directly to avoid constructor validation issues
if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
}

const createPrismaClient = () => {
  if (!dbUrl) {
    console.warn("DATABASE_URL is missing or empty.");
  }

  const options: any = {
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  };

  return new PrismaClient(options);
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
