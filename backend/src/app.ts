import "express-async-errors";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { authLimiter } from "./middleware/rateLimit";
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
import founderLetterRoutes from "./modules/hrms/documents/founderLetter.routes";
import selectionCertificateRoutes from "./modules/hrms/documents/selectionCertificate.routes";
import agreementRoutes from "./modules/legal/agreements.routes";
import signatoryRoutes from "./modules/legal/signatories.routes";
import profileRoutes from "./modules/profile/profile.routes";
import partnerAdminRoutes from "./modules/partners/partners.routes";
import partnerPortalRoutes from "./modules/partners/portal.routes";
import leadApplicationsRoutes from "./modules/lead-applications/lead-applications.routes";
import leadAppointmentRoutes from "./modules/lead-applications/appointments.routes";
import publicVerifyRoutes from "./modules/lead-applications/verify.routes";
import { publicKycRouter, adminKycRouter } from "./modules/lead-applications/kyc.routes";

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
app.use(compression());
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

// Body size limits — prevent memory abuse from oversized payloads.
// File uploads go through Supabase/S3, not through Express body.
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(morganMiddleware);

// Request timeout — prevent slow requests from hogging connections.
// If a handler doesn't respond within 30s, the client gets a 408.
app.use((req, res, next) => {
  res.setTimeout(30_000, () => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: "Request timeout — the server took too long to respond.",
        code: "REQUEST_TIMEOUT",
      });
    }
  });
  next();
});

// Server overload protection — if the event loop is lagging badly,
// reject new requests with 503 so the server can recover instead of crashing.
let lastLoopCheck = Date.now();
let eventLoopLag = 0;
setInterval(() => {
  const now = Date.now();
  eventLoopLag = now - lastLoopCheck - 500; // interval is 500ms
  lastLoopCheck = now;
}, 500).unref();

app.use((req, res, next) => {
  if (eventLoopLag > 500) {
    // Event loop is lagging >500ms — server is overloaded
    return res.status(503).json({
      success: false,
      error: "Server is under heavy load. Please retry in a moment.",
      code: "SERVICE_OVERLOADED",
    });
  }
  next();
});


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
 * Rate limiting — only on login/register to prevent brute-force attacks.
 * All other routes are unrestricted. DB is protected via connection
 * pooling and query timeouts in prisma.ts.
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
app.use("/api/ai", aiRoutes);
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
app.use("/api/admin/founders", founderLetterRoutes);
app.use("/api/admin/certificates", selectionCertificateRoutes);
app.use("/api/admin/agreements", agreementRoutes);
app.use("/api/admin/signatories", signatoryRoutes);
app.use("/api/admin/lead-appointments", leadAppointmentRoutes);
// Public: reached by scanning a printed document. No auth by design.
app.use("/api/verify", publicVerifyRoutes);
// Public: an applicant with an upload link and no account. Token-scoped.
app.use("/api/kyc", publicKycRouter);
app.use("/api/admin/lead-kyc", adminKycRouter);
app.use("/api/profile", profileRoutes);

// Partner perks. Administration is platform-admin only; the portal routes
// carry their own checks, including one public verification endpoint.
app.use("/api/admin/partners", partnerAdminRoutes);
app.use("/api", partnerPortalRoutes);
app.use("/api/lead-applications", leadApplicationsRoutes);

// Global Error Handler
app.use(errorHandler);
