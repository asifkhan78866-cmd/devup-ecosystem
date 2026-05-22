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

    // Graceful shutdown
    const shutdown = async () => {
      logger.info("Closing HTTP server...");
      server.close(async () => {
        logger.info("HTTP server closed.");
        await prisma.$disconnect();
        await redis.quit();
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
