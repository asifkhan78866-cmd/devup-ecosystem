import { Router } from "express";
import multer from "multer";
import { ApplicationsController } from "./applications.controller";
import { validate } from "../../middleware/validate";
import { applicationSchema, reviewApplicationSchema } from "./applications.schema";
import { requireAuth, requireRole } from "../../middleware/auth";
import { env } from "../../config/env";

const router = Router();
const controller = new ApplicationsController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

// Founder routes
router.post("/", requireAuth, validate(applicationSchema), controller.submitApplication);
router.post("/:id/pitch-deck", requireAuth, upload.single("file"), controller.uploadPitchDeck);
router.get("/:id", requireAuth, controller.getApplication);

// Admin routes
router.get("/", requireAuth, requireRole(["ADMIN"]), controller.getApplications);
router.patch("/:id/review", requireAuth, requireRole(["ADMIN"]), validate(reviewApplicationSchema), controller.reviewApplication);

export default router;
