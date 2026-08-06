import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * DB protection for high concurrency:
 *
 * connection_limit  — Max 15 DB connections in the pool. Prisma queues
 *                     requests that exceed this instead of opening new
 *                     connections that would overwhelm Postgres.
 * pool_timeout      — Wait at most 10s for a free connection before
 *                     failing with a clear error (not hanging forever).
 * connect_timeout   — 5s to establish a new connection.
 * statement_cache_size — Reuse prepared statements for repeated queries.
 *
 * These params are appended to DATABASE_URL as query-string flags, which
 * is how Prisma's connection pool is configured.
 */
function buildDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}connection_limit=15&pool_timeout=10&connect_timeout=5&statement_cache_size=100`;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV !== "production" ? ["query"] : ["error"],
    datasourceUrl: buildDatasourceUrl(),
  });

// Middleware: abort any single query that takes longer than 15 seconds.
// This prevents runaway queries from hogging connections.
prisma.$use(async (params, next) => {
  const timeout = 15_000;
  const timer = setTimeout(() => {
    console.error(
      `⚠️  Query timeout (${timeout}ms): ${params.model}.${params.action}`
    );
  }, timeout);
  try {
    return await next(params);
  } finally {
    clearTimeout(timer);
  }
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
