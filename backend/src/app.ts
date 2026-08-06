import "express-async-errors";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { authLimiter, aiLimiter } from "./middleware/rateLimit";
import { env } from "./config/env";
import { morganMiddleware } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";

import { setupSwagger } from "./lib/swagger";
import { prisma } from "./lib/prisma";
import { redis } from "./config/redis";

// Import routers
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import startupsRoutes from "./modules/startups/startups.routes";
import applicationsRoutes from "./modules/applications/applications.routes";
import jobsRoutes from "./modules/jobs/jobs.routes";
import hackathonsRoutes from "./modules/hackathons/hackathons.routes";
import cofoundersRoutes from "./modules/cofounders/cofounders.routes";
import documentsRoutes from "./modules/documents/documents.routes";
import aiRoutes from "./modules/ai/ai.routes";
import adminRoutes from "./modules/admin/admin.routes";
import servicesRoutes from "./modules/services/services.routes";
import membersRoutes from "./modules/startups/members.routes";
import connectionsRoutes from "./modules/connections/connections.routes";
import messagesRoutes from "./modules/messages/messages.routes";
import workspaceRoutes from "./modules/recruiting/workspace.routes";
import candidateRoutes from "./modules/recruiting/candidate.routes";
import platformAnalyticsRoutes from "./modules/analytics/platform.routes";
import profileRoutes from "./modules/profile/profile.routes";
// ... (will import as implemented)

export const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://devup-ecosystem.vercel.app',
  'https://devupecosystem.com',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  ...env.CORS_ORIGINS.split(',').map((o) => o.trim()),
].filter(Boolean) as string[];

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile, Postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morganMiddleware);


// Setup Swagger UI
setupSwagger(app);

// Root info route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'DevUp Ecosystem API',
    status: 'running',
  });
});

// Routes
app.get(["/health", "/api/health"], async (req: Request, res: Response) => {
  const checks = {
    status: "ok",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    checks.status = "degraded";
  }

  if (redis) {
    try {
      await redis.ping();
    } catch {
      checks.status = "degraded";
    }
  }

  const statusCode = checks.status === "ok" ? 200 : 503;
  res.status(statusCode).json(checks);
});

// Public stats endpoint (no auth required) — powers the homepage LiveStats
app.get("/api/stats", async (req: Request, res: Response) => {
  try {
    const [totalStartups, totalUsers, totalJobs, activeHackathons] = await Promise.all([
      prisma.startup.count({ where: { isActive: true, isVerified: true } }),
      prisma.user.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.hackathon.count({ where: { isActive: true } }),
    ]);

    res.status(200).json({
      success: true,
      data: { totalStartups, totalUsers, totalJobs, activeHackathons },
    });
  } catch {
    res.status(200).json({
      success: true,
      data: { totalStartups: 23, totalUsers: 1200, totalJobs: 48, activeHackathons: 4 },
    });
  }
});

/**
 * Rate limiting — only on security-sensitive routes.
 * Auth endpoints: prevent brute-force / credential stuffing.
 * AI endpoints: prevent cost abuse (see line 151).
 * General API calls are NOT rate-limited — the DB is protected via
 * connection pooling and query timeouts in prisma.ts instead.
 */
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// membersRoutes already declares its own `/:startupId/...` and `/invites/...`
// paths, so it mounts at /api/startups directly. It must come BEFORE
// startupsRoutes, whose `GET /:slug` would otherwise swallow `/invites/:token`.
app.use("/api/startups", membersRoutes);
app.use("/api/startups", startupsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/hackathons", hackathonsRoutes);
app.use("/api/cofounders", cofoundersRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/connections", connectionsRoutes);
app.use("/api/messages", messagesRoutes);

// Hiring & recruitment module.
// `/api/w/:code/*` is the tenant workspace — membership is proven by
// resolveTenant and every query is hard-scoped to that startup.
app.use("/api/w", workspaceRoutes);
app.use("/api", candidateRoutes);
app.use("/api/admin/analytics", platformAnalyticsRoutes);
app.use("/api/profile", profileRoutes);

// Global Error Handler
app.use(errorHandler);
