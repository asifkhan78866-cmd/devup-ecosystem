import { Router } from "express";
import multer from "multer";
import { HackathonsController } from "./hackathons.controller";
import { validate } from "../../middleware/validate";
import { hackathonSchema, updateHackathonSchema, registerHackathonSchema } from "./hackathons.schema";
import { requireAuth, requireRole } from "../../middleware/auth";
import { env } from "../../config/env";

const router = Router();
const controller = new HackathonsController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

router.get("/", controller.getHackathons);
router.get("/:id", controller.getHackathon);

router.post("/", requireAuth, requireRole(["ADMIN"]), validate(hackathonSchema), controller.createHackathon);
router.patch("/:id", requireAuth, requireRole(["ADMIN"]), validate(updateHackathonSchema), controller.updateHackathon);
router.delete("/:id", requireAuth, requireRole(["ADMIN"]), controller.deleteHackathon);

router.post("/:id/logo", requireAuth, requireRole(["ADMIN"]), upload.single("file"), controller.uploadLogo);
router.post("/:id/banner", requireAuth, requireRole(["ADMIN"]), upload.single("file"), controller.uploadBanner);

router.post("/:id/register", requireAuth, validate(registerHackathonSchema), controller.register);

export default router;
