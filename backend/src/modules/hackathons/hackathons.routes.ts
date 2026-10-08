import { Router } from "express";
import multer from "multer";
import { HackathonsController } from "./hackathons.controller";
import { validate } from "../../middleware/validate";
import { hackathonSchema, updateHackathonSchema, registerHackathonSchema, leadRegistrationSchema, leadAccessSchema } from "./hackathons.schema";
import { hackathonLeadLimiter } from "../../middleware/rateLimit";
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

// Public registration. Returns the team's private access token, never an id.
router.post("/:id/lead", hackathonLeadLimiter, validate(leadRegistrationSchema), controller.createLead);
// "Email me my link": goes to the inbox on file, never to the requester.
router.post("/:id/leads/access-link", hackathonLeadLimiter, validate(leadAccessSchema), controller.requestLeadAccess);

// A team's own registration, addressed by the X-Lead-Token header — not by id,
// and not by phone number (which used to hand out the whole team's details).
router.get("/:id/leads/me", controller.myLead);
router.patch("/:id/leads/me", controller.updateMyLead);
router.post("/:id/leads/me/submission", upload.single("file"), controller.submitMyLead);
router.patch("/:id/leads/me/redirect", controller.markMyLeadRedirected);


// Admin: list leads from the website
router.get("/:id/leads", requireAuth, requireRole(["ADMIN"]), controller.getLeads);


// Submissions (Phase 1)
router.get("/:id/submissions", requireAuth, requireRole(["ADMIN"]), controller.getAllSubmissions);
router.patch("/:id/submissions/:submissionId/status", requireAuth, requireRole(["ADMIN"]), controller.updateSubmissionStatus);

export default router;
