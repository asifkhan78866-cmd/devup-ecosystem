import { Router } from "express";
import { z } from "zod";
import type { AgreementType } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as agreements from "./agreements.service";
import { AGREEMENT_TEMPLATES } from "./agreementTemplates";

/**
 * MOUs and letters on DevUp letterhead. Platform admins only — these bind the
 * company, so issuing one is not a per-startup permission.
 */
const router = Router();
const ok = (res: any, data: unknown, status = 200) => res.status(status).json({ success: true, data });

/** Reference numbers contain slashes, which are not legal in a filename. */
const safeFileName = (v: string) => v.split("/").join("-").split("\\").join("-");

router.use(requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]));

/**
 * Derived from the templates, never listed again here.
 *
 * This was a hand-written copy of the same list, and adding LETTER to the
 * templates and the schema left it behind — so the type appeared in the picker
 * and was then rejected by the endpoint that picker posts to. A second copy of
 * a list is a second thing to forget.
 */
const TYPES = Object.keys(AGREEMENT_TEMPLATES) as [AgreementType, ...AgreementType[]];

const body = z.object({
  body: z.object({
    type: z.enum(TYPES),
    title: z.string().max(200).optional(),
    partyName: z.string().min(2).max(200),
    partyAddress: z.string().max(500).optional(),
    partySignatory: z.string().max(160).optional(),
    partyTitle: z.string().max(160).optional(),
    partyEmail: z.string().email().optional().or(z.literal("")),
    contentHtml: z.string().max(200000).optional(),
    effectiveDate: z.string().nullish(),
    expiryDate: z.string().nullish(),
    signatoryName: z.string().max(160).optional(),
    signatoryTitle: z.string().max(160).optional(),
  }),
});

/** The pickable types, with their starter content. */
router.get("/templates", (_req, res) => {
  ok(
    res,
    Object.entries(AGREEMENT_TEMPLATES).map(([key, t]) => ({
      type: key,
      label: t.label,
      blurb: t.blurb,
      title: t.title,
      subtitle: t.subtitle,
      abbr: t.abbr,
      bodyHtml: t.bodyHtml,
    }))
  );
});


router.get("/", async (_req, res) => ok(res, await agreements.listAgreements()));
router.get("/:id", async (req, res) => ok(res, await agreements.getAgreement(req.params.id as string)));

router.post("/", validate(body), async (req, res) => {
  ok(res, await agreements.createAgreement(req.body, req.user!.id), 201);
});

router.patch("/:id", async (req, res) => {
  ok(res, await agreements.updateAgreement(req.params.id as string, req.body, req.user!.id));
});

router.delete("/:id", async (req, res) => {
  ok(res, await agreements.deleteAgreement(req.params.id as string, req.user!.id));
});

/** Live preview — HTML, so it opens instantly without spending a render. */
router.get("/:id/preview", async (req, res) => {
  const a = await agreements.getAgreement(req.params.id as string);
  res.type("html").send(await agreements.renderAgreement(a));
});

/** The real thing, letterhead on every page. */
router.get("/:id/pdf", async (req, res) => {
  const a = await agreements.getAgreement(req.params.id as string);
  const pdf = await agreements.renderAgreementPdf(a);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${safeFileName(a.documentNo ?? a.title)}.pdf"`
  );
  res.send(pdf);
});

/** Emails the issued document to the second party, with the PDF attached. */
router.post("/:id/send", async (req, res) =>
  ok(res, await agreements.sendAgreement(req.params.id as string, (req as any).user.id))
);

router.post("/:id/issue", async (req, res) => {
  ok(res, await agreements.issueAgreement(req.params.id as string, req.user!.id));
});

router.post(
  "/:id/status",
  validate(z.object({ body: z.object({ status: z.enum(["SIGNED", "CANCELLED", "ISSUED"]) }) })),
  async (req, res) => {
    ok(res, await agreements.setStatus(req.params.id as string, req.body.status, req.user!.id));
  }
);

export default router;
