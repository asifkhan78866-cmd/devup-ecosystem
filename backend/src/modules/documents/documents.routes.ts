import { Router } from "express";
import multer from "multer";
import { DocumentsController } from "./documents.controller";
import { validate } from "../../middleware/validate";
import { uploadDocumentSchema } from "./documents.schema";
import { requireAuth, requireRole } from "../../middleware/auth";
import { env } from "../../config/env";

const router = Router();
const controller = new DocumentsController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

router.post("/", requireAuth, requireRole(["ADMIN"]), upload.single("file"), validate(uploadDocumentSchema), controller.uploadDocument);
router.get("/", requireAuth, requireRole(["ADMIN"]), controller.getDocuments);
router.get("/:id", requireAuth, controller.getDocument);
router.post("/:id/sign", requireAuth, controller.signDocument);

export default router;
