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
router.delete("/:id", requireAuth, requireRole(["ADMIN", "FOUNDER"]), controller.deleteJob);

router.post("/:id/apply", requireAuth, requireRole(["STUDENT", "FOUNDER"]), validate(applyJobSchema), controller.applyForJob);

export default router;
