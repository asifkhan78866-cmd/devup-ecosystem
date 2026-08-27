import { Router } from "express";
import { z } from "zod";
import { LeadershipRole, LeadAppointmentStatus } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as appointments from "./appointments.service";
import { DOCUMENT_KINDS, DocumentKind } from "./appointments.service";

/**
 * Deeds of appointment for the Lead DevUp directorate.
 *
 * Platform admins only: these appoint people to represent DevUp itself across
 * a territory, so it is not a per-startup permission.
 */
const router = Router();
const ok = (res: any, data: unknown, status = 200) => res.status(status).json({ success: true, data });

/** Instrument numbers contain slashes, which are not legal in a filename. */
const safeFileName = (documentNo: string) => documentNo.replace(/[\/\\]/g, "-");

const roles = z.nativeEnum(LeadershipRole);

/**
 * Which of the three documents to render. Defaults to the deed so links issued
 * before the certificate and handbook existed still resolve to something.
 */
function kindOf(req: any): DocumentKind {
  const k = String(req.query.kind ?? req.params.kind ?? "deed");
  return (DOCUMENT_KINDS as readonly string[]).includes(k) ? (k as DocumentKind) : "deed";
}

const FILE_LABEL: Record<DocumentKind, string> = {
  certificate: "Certificate-of-Appointment",
  deed: "Deed-of-Appointment",
  handbook: "Directorate-Handbook",
};

const issueBody = z.object({
  body: z
    .object({
      applicationId: z.string().uuid().optional(),
      role: roles.optional(),
      fullName: z.string().min(2).max(120).optional(),
      email: z.string().email().optional(),
      phone: z.string().max(20).optional(),
      state: z.string().max(80).optional(),
      city: z.string().max(80).optional(),
      college: z.string().max(160).optional(),
      jurisdiction: z.string().max(160).optional(),
      termMonths: z.number().int().min(1).max(60).optional(),
      effectiveFrom: z.string().optional(),
      force: z.boolean().optional(),
    })
    .refine((b) => Boolean(b.applicationId) || Boolean(b.role && b.fullName && b.email && b.state), {
      message: "Provide an application, or the role, name, email and state",
    }),
});

router.use(requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]));

/** The four offices, with their duties — drives the admin picker. */
router.get("/tiers", (_req, res) => ok(res, appointments.tiers()));

/** Selected applicants and whether each already holds a deed. */
router.get("/pending", async (_req, res) => ok(res, await appointments.pendingSelections()));

router.get("/", async (req, res) => {
  const role = roles.safeParse(req.query.role);
  const status = z.nativeEnum(LeadAppointmentStatus).safeParse(req.query.status);
  ok(
    res,
    await appointments.listAppointments({
      role: role.success ? role.data : undefined,
      status: status.success ? status.data : undefined,
    })
  );
});

router.get("/:id", async (req, res) => ok(res, await appointments.getAppointment(req.params.id as string)));

/** Any of the three as HTML, for the preview pane. `?kind=certificate|deed|handbook`. */
router.get("/:id/preview", async (req, res) => {
  const html = await appointments.renderAppointment(req.params.id as string, kindOf(req));
  res.type("html").send(html);
});

router.get("/:id/pdf", async (req, res) => {
  const id = req.params.id as string;
  const kind = kindOf(req);
  const a = await appointments.getAppointment(id);
  const pdf = await appointments.renderAppointmentPdf(id, kind);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${FILE_LABEL[kind]}-${safeFileName(a.documentNo)}.pdf"`
  );
  res.send(pdf);
});

router.post("/", validate(issueBody), async (req, res) => {
  const result = await appointments.issueAppointment({ ...req.body, actorId: (req as any).user.id });
  ok(res, result, result.created ? 201 : 200);
});

/** Issues for everyone marked Selected who does not already hold a deed. */
router.post("/issue-all", async (req, res) =>
  ok(res, await appointments.issueForAllSelected((req as any).user.id))
);

router.post("/:id/resend", async (req, res) =>
  ok(res, await appointments.resendAppointment(req.params.id as string))
);

router.post(
  "/:id/revoke",
  validate(z.object({ body: z.object({ reason: z.string().min(3).max(500) }) })),
  async (req, res) =>
    ok(res, await appointments.revokeAppointment(req.params.id as string, req.body.reason, (req as any).user.id))
);

export default router;
