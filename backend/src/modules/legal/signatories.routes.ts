import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { env } from "../../config/env";

/**
 * The directors who sign in DevUp's own name.
 *
 * Served rather than hard-coded in each admin screen so that certificates,
 * MOUs and founder letters cannot drift into disagreeing about who holds which
 * office — and so a change of title is one deploy, not a search across two
 * codebases for names spelled slightly differently.
 */
const router = Router();

router.get("/", requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]), (_req, res) => {
  res.json({ success: true, data: env.DEVUP_SIGNATORIES });
});

export default router;
