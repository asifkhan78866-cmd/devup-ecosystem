import { Router } from "express";
import multer from "multer";
import { UsersController } from "./users.controller";
import { validate } from "../../middleware/validate";
import { updateUserSchema } from "./users.schema";
import { requireAuth, requireRole } from "../../middleware/auth";
import { env } from "../../config/env";

const router = Router();
const controller = new UsersController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

router.get("/", controller.getUsers);
router.get("/:id", controller.getUser);
router.patch("/:id", requireAuth, validate(updateUserSchema), controller.updateUser);
router.post("/:id/resume", requireAuth, upload.single("resume"), controller.uploadResume);
router.get("/:id/applications", requireAuth, controller.getApplications);
router.get("/:id/notifications", requireAuth, controller.getNotifications);
router.get("/:id/activity", requireAuth, controller.getActivity);
router.delete("/:id", requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]), controller.deleteUser);

export default router;
