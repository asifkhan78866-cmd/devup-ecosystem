import { Router } from "express";
import multer from "multer";
import { StartupsController } from "./startups.controller";
import { validate } from "../../middleware/validate";
import { startupSchema, updateStartupSchema } from "./startups.schema";
import { requireAuth, requireRole } from "../../middleware/auth";
import { env } from "../../config/env";

const router = Router();
const controller = new StartupsController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

// Public routes
router.get("/", controller.getStartups);
router.get("/featured", controller.getFeatured);
router.get("/:slug", controller.getBySlug);
router.get("/:id/jobs", controller.getJobs);

// Protected routes
router.post(
  "/", 
  requireAuth, 
  requireRole(["ADMIN", "FOUNDER"]), 
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "screenshots", maxCount: 6 },
  ]),
  validate(startupSchema), 
  controller.createStartup
);

router.patch(
  "/:id", 
  requireAuth, 
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "screenshots", maxCount: 6 },
  ]),
  validate(updateStartupSchema), 
  controller.updateStartup
);

router.delete("/:id", requireAuth, requireRole(["ADMIN"]), controller.deleteStartup);
router.post("/:id/logo", requireAuth, upload.single("file"), controller.uploadLogo);
router.post("/:id/banner", requireAuth, upload.single("file"), controller.uploadBanner);
router.get("/:id/documents", requireAuth, controller.getDocuments);
router.get("/:id/job-applications", requireAuth, controller.getJobApplications);

export default router;
