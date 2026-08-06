import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../../middleware/auth";
import { validate } from "../../../middleware/validate";
import * as founderLetters from "./founderLetter.service";

/**
 * Founder letters, managed from the DevUp admin.
 *
 * Founders belong to individual startups, but issuing their letters is an
 * ecosystem-level job — one screen covering every startup rather than opening
 * each workspace in turn. Platform admins only.
 */
const router = Router();
const ok = (res: any, data: unknown, status = 200) => res.status(status).json({ success: true, data });

router.use(requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]));

router.get("/", async (_req, res) => {
  ok(res, await founderLetters.listAllFounders());
});

router.post("/:memberId/letter", async (req, res) => {
  ok(res, await founderLetters.issueFromPlatform(req.params.memberId as string, req.user!.id, req.body?.force === true), 201);
});

/** Send to a chosen set — the admin ticks who, so nothing goes out unseen. */
router.post(
  "/letters",
  validate(z.object({ body: z.object({ memberIds: z.array(z.string()).min(1).max(200) }) })),
  async (req, res) => {
    ok(res, await founderLetters.issueForSelected(req.body.memberIds, req.user!.id));
  }
);

export default router;
