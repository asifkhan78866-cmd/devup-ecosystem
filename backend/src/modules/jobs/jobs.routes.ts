import { Router } from "express";
import { JobsController } from "./jobs.controller";
import { validate } from "../../middleware/validate";
import { jobSchema, updateJobSchema, applyJobSchema } from "./jobs.schema";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();
const controller = new JobsController();

router.get("/", controller.getJobs);
router.get("/:id", controller.getJob);

router.post("/", requireAuth, requireRole(["ADMIN", "FOUNDER"]), validate(jobSchema), controller.createJob);
router.patch("/:id", requireAuth, requireRole(["ADMIN", "FOUNDER"]), validate(updateJobSchema), controller.updateJob);
router.delete("/:id", requireAuth, requireRole(["ADMIN"]), controller.deleteJob);

import multer from "multer";
import { env } from "../../config/env";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

router.post("/:id/apply", requireAuth, requireRole(["STUDENT", "FOUNDER"]), upload.single("resume"), validate(applyJobSchema), controller.applyForJob);
router.get("/:id/applications", requireAuth, requireRole(["ADMIN", "FOUNDER"]), controller.getJobApplications);

export default router;
