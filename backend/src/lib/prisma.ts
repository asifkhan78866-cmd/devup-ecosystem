import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV !== "production" ? ["query"] : ["error"],
    datasourceUrl: process.env.DATABASE_URL
      ? `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes("?") ? "&" : "?"}connection_limit=10&pool_timeout=5&statement_cache_size=100`
      : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
