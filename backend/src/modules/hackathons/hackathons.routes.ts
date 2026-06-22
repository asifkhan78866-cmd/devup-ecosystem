import { Router } from "express";
import multer from "multer";
import { HackathonsController } from "./hackathons.controller";
import { validate } from "../../middleware/validate";
import { hackathonSchema, updateHackathonSchema, registerHackathonSchema, leadRegistrationSchema } from "./hackathons.schema";
import { requireAuth, requireRole } from "../../middleware/auth";
import { env } from "../../config/env";

const router = Router();
const controller = new HackathonsController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

// Public queries
router.get("/", controller.getHackathons);
router.get("/featured", controller.getFeatured);
router.get("/:id", controller.getById);

router.post("/", requireAuth, requireRole(["ADMIN"]), validate(hackathonSchema), controller.createHackathon);
router.patch("/:id", requireAuth, requireRole(["ADMIN"]), validate(updateHackathonSchema), controller.updateHackathon);
router.delete("/:id", requireAuth, requireRole(["ADMIN"]), controller.deleteHackathon);

router.post("/:id/logo", requireAuth, requireRole(["ADMIN"]), upload.single("file"), controller.uploadLogo);
router.post("/:id/banner", requireAuth, requireRole(["ADMIN"]), upload.single("file"), controller.uploadBanner);

// Partners Management
router.post("/:id/partners", requireAuth, requireRole(["ADMIN"]), controller.createPartner);
router.patch("/:id/partners/:pid", requireAuth, requireRole(["ADMIN"]), controller.updatePartner);
router.delete("/:id/partners/:pid", requireAuth, requireRole(["ADMIN"]), controller.deletePartner);
router.post("/:id/partners/:pid/logo", requireAuth, requireRole(["ADMIN"]), upload.single("file"), controller.uploadPartnerLogo);

router.post("/:id/register", requireAuth, validate(registerHackathonSchema), controller.register);

// Public lead capture (no auth — saves to DB before redirecting to Google Form)
router.post("/:id/lead", validate(leadRegistrationSchema), controller.createLead);

// Mark lead as redirected
router.patch("/:id/lead/:leadId/redirect", controller.markLeadRedirected);

// Admin: list leads from the website
router.get("/:id/leads", requireAuth, requireRole(["ADMIN"]), controller.getLeads);

export default router;
