import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { LeadKycDocType } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as kyc from "./kyc.service";

/**
 * Two routers, kept apart on purpose.
 *
 * The applicant's half is public — reached with a token by someone who has no
 * DevUp account — and must expose nothing beyond what the holder of that link
 * already knows about themselves. The reviewer's half is admin-only and hands
 * out signed links to the actual scans.
 *
 * Mixing them behind one mount is how a public route quietly inherits an admin
 * capability, so they are separate files' worth of care even in one.
 */

const upload = multer({
  storage: multer.memoryStorage(),
  // Also enforced in the service; here it stops an 8MB+ body being buffered at
  // all rather than rejecting it after the fact.
  limits: { fileSize: 8 * 1024 * 1024 },
});

const docType = z.nativeEnum(LeadKycDocType);
const ok = (res: any, data: unknown, status = 200) => res.status(status).json({ success: true, data });

// ── Applicant, by token. No authentication. ────────────────────────────
export const publicKycRouter = Router();

publicKycRouter.get("/:token", async (req, res) => {
  res.set("Cache-Control", "no-store");
  ok(res, await kyc.kycByToken(String(req.params.token)));
});

publicKycRouter.post("/:token/upload", upload.single("file"), async (req, res) => {
  const parsed = docType.safeParse(req.body?.docType);
  if (!parsed.success) throw Object.assign(new Error("Unknown document type"), { status: 400 });
  if (!req.file) throw Object.assign(new Error("No file received"), { status: 400 });

  ok(
    res,
    await kyc.uploadKycDocument({
      token: String(req.params.token),
      docType: parsed.data,
      idKind: req.body?.idKind,
      number: req.body?.number,
      file: req.file as any,
    })
  );
});

// ── Reviewer. Platform admins only. ────────────────────────────────────
export const adminKycRouter = Router();
adminKycRouter.use(requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]));

/** What must be produced, so the admin screen and the emails agree. */
adminKycRouter.get("/requirements", (_req, res) => ok(res, kyc.REQUIRED_DOCS));

adminKycRouter.get("/", async (_req, res) => ok(res, await kyc.reviewQueue()));

/** Creates the request if needed and emails the link. Safe to press twice. */
adminKycRouter.post(
  "/request",
  validate(z.object({ body: z.object({ applicationId: z.string().uuid() }) })),
  async (req, res) => ok(res, await kyc.sendKycRequest(req.body.applicationId, (req as any).user.id))
);

adminKycRouter.post(
  "/:id/review",
  validate(
    z.object({
      body: z.object({
        docType,
        approve: z.boolean(),
        reason: z.string().max(300).optional(),
      }),
    })
  ),
  async (req, res) =>
    ok(
      res,
      await kyc.reviewDocument({
        kycId: req.params.id as string,
        docType: req.body.docType,
        approve: req.body.approve,
        reason: req.body.reason,
        actorId: (req as any).user.id,
      })
    )
);
