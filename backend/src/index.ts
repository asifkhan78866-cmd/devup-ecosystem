import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./middleware/logger";
import { prisma } from "./lib/prisma";
import { redis } from "./config/redis";

// Initialize BullMQ workers
import "./jobs/emailQueue";
import "./jobs/aiQueue";
import "./jobs/documentQueue";

const startServer = async () => {
  try {
    // Check DB connection
    await prisma.$connect();
    logger.info("✅ Connected to Database (PostgreSQL via Prisma)");

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
      logger.info(`📚 Swagger docs available at http://localhost:${env.PORT}/api/docs`);
    });

    // Keep-alive and header timeouts — prevent idle connections from
    // accumulating and consuming file descriptors.
    server.keepAliveTimeout = 65_000; // slightly above typical LB idle timeout (60s)
    server.headersTimeout = 66_000;   // must be > keepAliveTimeout

    // Max connections — prevent the process from accepting more TCP
    // connections than it can reasonably handle. Excess connections
    // will queue at the OS level and eventually time out gracefully.
    server.maxConnections = 1000;

    // Graceful shutdown — stop accepting new connections, drain existing
    // ones, then clean up resources. Render sends SIGTERM before killing.
    let isShuttingDown = false;

    const shutdown = async (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      logger.info(`${signal} received — starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info("HTTP server closed — all connections drained.");
        await prisma.$disconnect();
        if (redis) await redis.quit();
        process.exit(0);
      });

      // Force exit after 10s if connections don't drain
      setTimeout(() => {
        logger.warn("Forcefully shutting down after 10s timeout.");
        process.exit(1);
      }, 10_000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Prevent crashes from unhandled promise rejections or exceptions.
    // Log and continue — a single bad request should never bring down the server.
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection:", reason);
    });

    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception:", err);
      // For truly fatal errors, shut down gracefully rather than abruptly
      if (err.message.includes("ENOMEM") || err.message.includes("heap")) {
        shutdown("uncaughtException");
      }
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
