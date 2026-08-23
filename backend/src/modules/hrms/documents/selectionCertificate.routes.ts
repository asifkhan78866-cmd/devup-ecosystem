import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../../middleware/auth";
import { validate } from "../../../middleware/validate";
import { buildBatchPdf, buildBatchHtml } from "./selectionCertificate.service";
import { audit } from "../../shared/audit.service";

/**
 * Blank selection certificates for events. Platform admins only — these carry
 * DevUp's own seal and signature, so who can print them is an ecosystem
 * decision rather than a startup one.
 */
const router = Router();

router.use(requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]));

const batchBody = z.object({
  body: z.object({
    count: z.coerce.number().int().min(1).max(100),
    college: z.string().max(160).optional(),
    issueDate: z.string().max(60).optional(),
    signatories: z
      .array(z.object({ name: z.string().max(120), title: z.string().max(120) }))
      .max(3)
      .optional(),
    signatoryName: z.string().max(120).optional(),
    signatoryTitle: z.string().max(120).optional(),
    numbered: z.boolean().optional(),
  }),
});

/** Preview one copy in the browser without spending a PDF render. */
router.post("/preview", validate(batchBody), (req, res) => {
  res.type("html").send(buildBatchHtml({ ...req.body, count: 1 }));
});

router.post("/batch", validate(batchBody), async (req, res) => {
  const pdf = await buildBatchPdf(req.body);

  await audit({
    action: "certificate.batch_printed",
    entity: "SelectionCertificate",
    actorId: req.user!.id,
    metadata: { count: req.body.count, college: req.body.college ?? null },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="DevUp-Selection-Certificates-${req.body.count}.pdf"`
  );
  res.send(pdf);
});

export default router;
