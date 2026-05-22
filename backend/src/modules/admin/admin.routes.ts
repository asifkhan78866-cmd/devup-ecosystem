import { Router } from "express";
import { AdminController } from "./admin.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();
const controller = new AdminController();

router.use(requireAuth);
router.use(requireRole(["ADMIN"]));

router.get("/stats", controller.getStats);
router.get("/audit-logs", controller.getAuditLogs);

export default router;
