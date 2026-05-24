import "express-async-errors";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { morganMiddleware } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimit";
import { setupSwagger } from "./lib/swagger";

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
// ... (will import as implemented)

export const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS.split(",") }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morganMiddleware);
app.use(globalLimiter);

// Setup Swagger UI
setupSwagger(app);

// Routes
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/startups", startupsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/hackathons", hackathonsRoutes);
app.use("/api/cofounders", cofoundersRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", servicesRoutes);

// Global Error Handler
app.use(errorHandler);
