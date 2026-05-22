import { Router } from "express";
import { CofoundersController } from "./cofounders.controller";
import { validate } from "../../middleware/validate";
import { cofounderProfileSchema, updateCofounderProfileSchema, cofounderRequestSchema, updateRequestSchema } from "./cofounders.schema";
import { requireAuth } from "../../middleware/auth";

const router = Router();
const controller = new CofoundersController();

router.get("/", controller.getProfiles);
router.get("/requests", requireAuth, controller.getRequests);
router.get("/:id", controller.getProfile);

router.post("/", requireAuth, validate(cofounderProfileSchema), controller.createProfile);
router.patch("/", requireAuth, validate(updateCofounderProfileSchema), controller.updateProfile);

router.post("/:id/request", requireAuth, validate(cofounderRequestSchema), controller.sendRequest);
router.patch("/requests/:id", requireAuth, validate(updateRequestSchema), controller.updateRequestStatus);

export default router;
