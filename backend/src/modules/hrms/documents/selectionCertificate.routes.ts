import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../../middleware/auth";
import { validate } from "../../../middleware/validate";
import {
  buildBatchPdf,
  buildBatchHtml,
  getNextSerialOffset,
  getBatchHistory,
  serialFor,
} from "./selectionCertificate.service";
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

/** Get history of all previously generated certificate batches */
router.get("/history", async (req, res) => {
  const history = await getBatchHistory();
  res.json({ success: true, data: history });
});

/** Preview one copy in the browser without spending a PDF render. */
router.post("/preview", validate(batchBody), async (req, res) => {
  const startOffset = await getNextSerialOffset();
  res.type("html").send(buildBatchHtml({ ...req.body, count: 1, startOffset }));
});

router.post("/batch", validate(batchBody), async (req, res) => {
  const startOffset = await getNextSerialOffset();
  const pdf = await buildBatchPdf({ ...req.body, startOffset });

  const count = Math.floor(req.body.count);
  const startSerial = serialFor(1, startOffset);
  const endSerial = serialFor(count, startOffset);

  await audit({
    action: "certificate.batch_printed",
    entity: "SelectionCertificate",
    actorId: req.user!.id,
    metadata: {
      count,
      college: req.body.college ?? null,
      issueDate: req.body.issueDate ?? null,
      startSerial,
      endSerial,
      serialRange: count === 1 ? startSerial : `${startSerial} — ${endSerial}`,
    },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="DevUp-Selection-Certificates-${count}.pdf"`
  );
  res.send(pdf);
});

export default router;
