import { Router } from "express";
import { LeadApplicationsController } from "./lead-applications.controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  submitLeadApplicationSchema,
  updateLeadApplicationStatusSchema,
} from "./lead-applications.schema";

const router = Router();
const controller = new LeadApplicationsController();

// Public submission route
router.post("/", validate(submitLeadApplicationSchema), (req, res, next) => controller.submitApplication(req, res).catch(next));

// Admin routes
router.get("/", requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]), (req, res, next) => controller.getApplications(req, res).catch(next));
router.get("/:id", requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]), (req, res, next) => controller.getApplicationById(req, res).catch(next));
router.patch("/:id/status", requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]), validate(updateLeadApplicationStatusSchema), (req, res, next) => controller.updateStatus(req, res).catch(next));

export default router;
