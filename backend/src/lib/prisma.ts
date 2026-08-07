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

function createClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV !== "production" ? ["warn", "error"] : ["error"],
    datasourceUrl: buildDatasourceUrl(),
  });

  // Log (not throw) any query that takes longer than 15 seconds.
  // This detects runaway queries without breaking anything.
  client.$use(async (params, next) => {
    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;
    if (duration > 15_000) {
      console.warn(
        `⚠️  Slow query (${duration}ms): ${params.model}.${params.action}`
      );
    }
    return result;
  });

  return client;
}

// Reuse the same client across hot reloads in development.
// The middleware is registered inside createClient(), so it is only added once.
export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
