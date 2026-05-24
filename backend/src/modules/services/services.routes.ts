import { Router } from "express";
import { ServicesController } from "./services.controller";
import { validate } from "../../middleware/validate";
import { createServiceRequestSchema, updateServiceRequestStatusSchema } from "./services.schema";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

// Public endpoint
router.post("/request", validate(createServiceRequestSchema), ServicesController.createRequest);

// Admin endpoints
router.get("/requests", requireAuth, requireRole(["ADMIN"]), ServicesController.getAllRequests);
router.patch("/requests/:id", requireAuth, requireRole(["ADMIN"]), validate(updateServiceRequestStatusSchema), ServicesController.updateStatus);

export default router;
