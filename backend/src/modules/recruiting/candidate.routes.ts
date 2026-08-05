import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { env } from "../../config/env";
import { ApplicationsController } from "./applications/applications.controller";
import { applySchema } from "./applications/applications.schema";
import * as offers from "./offers/offers.service";
import * as onboarding from "../hrms/onboarding/onboarding.service";
import * as internAttendance from "../hrms/attendance/intern.service";
import { claimIfEmpty } from "../shared/claim.service";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";

const router = Router();
const controller = new ApplicationsController();
const ok = (res: any, data: unknown, status = 200) => res.status(status).json({ success: true, data });

const onboardingUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

/**
 * Candidate-facing. These are scoped by ownership (userId), not by tenant —
 * a student's applications span every startup they applied to.
 */

router.post(
  "/jobs/:id/apply",
  requireAuth,
  upload.single("resume"),
  validate(applySchema),
  (req, res) => controller.apply(req, res)
);

router.get("/me/applications", requireAuth, (req, res) => controller.mine(req, res));

/**
 * Has the signed-in user already applied to this job, and where are they?
 * Returns null rather than 404 so the job page can render either the apply form
 * or the progress view from a single call.
 */
router.get("/jobs/:id/my-application", requireAuth, async (req, res) => {
  const app = await prisma.jobApplication.findUnique({
    where: { jobId_userId: { jobId: req.params.id as string, userId: req.user!.id } },
    select: {
      id: true,
      applicationNo: true,
      stage: true,
      outcome: true,
      appliedAt: true,
      rejectionReason: true,
      job: {
        select: {
          title: true,
          pipelineTemplate: true,
          startup: { select: { name: true, logoUrl: true } },
        },
      },
      events: {
        orderBy: { createdAt: "asc" },
        select: { toStage: true, outcome: true, note: true, createdAt: true },
      },
      interviews: {
        where: { status: { in: ["SCHEDULED", "RESCHEDULED"] } },
        orderBy: { scheduledAt: "asc" },
        select: { id: true, stage: true, scheduledAt: true, mode: true, meetingUrl: true, timezone: true },
      },
      offer: {
        select: {
          id: true, offerNo: true, designation: true, ctc: true, stipend: true,
          joiningDate: true, expiresAt: true, status: true,
        },
      },
    },
  });

  ok(res, app);
});

router.get("/me/applications/:id", requireAuth, async (req, res) => {
  const app = await prisma.jobApplication.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
    include: {
      job: { select: { title: true, type: true, location: true, startup: { select: { name: true, code: true, logoUrl: true } } } },
      events: { orderBy: { createdAt: "asc" }, select: { toStage: true, outcome: true, createdAt: true, note: true } },
      interviews: {
        orderBy: { scheduledAt: "desc" },
        select: { id: true, stage: true, scheduledAt: true, mode: true, meetingUrl: true, status: true, timezone: true },
      },
      offer: {
        select: { id: true, offerNo: true, designation: true, ctc: true, stipend: true, joiningDate: true, expiresAt: true, status: true },
      },
    },
  });
  if (!app) return res.status(404).json({ success: false, error: "Application not found", code: "NOT_FOUND" });
  ok(res, app);
});

router.post("/me/applications/:id/withdraw", requireAuth, (req, res) => controller.withdraw(req, res));

router.post(
  "/me/applications/:id/offer/respond",
  requireAuth,
  validate(
    z.object({
      body: z.object({
        accept: z.boolean(),
        reason: z.string().max(1000).optional(),
      }),
    })
  ),
  async (req, res) => {
    ok(
      res,
      await offers.respond(req.params.id as string, req.user!.id, req.body.accept, req.body.reason)
    );
  }
);

/**
 * A joiner's own onboarding: which documents are outstanding and where to
 * upload them. Scoped by their own employee/intern records, so one call covers
 * every startup they have joined.
 */
router.get("/me/onboarding", requireAuth, async (req, res) => {
  const load = () => Promise.all([
    prisma.employee.findMany({
      where: { userId: req.user!.id, status: { in: ["ACTIVE", "NOTICE"] } },
      select: { id: true, startupId: true, startup: { select: { name: true, code: true, logoUrl: true } } },
    }),
    prisma.intern.findMany({
      where: { userId: req.user!.id, status: { in: ["ACTIVE", "NOTICE"] } },
      select: { id: true, startupId: true, startup: { select: { name: true, code: true, logoUrl: true } } },
    }),
  ]);

  let [employees, interns] = await load();
  // Onboarded before they signed up? Attach the records, then read again.
  if (await claimIfEmpty(req.user!.id, req.user!.email, employees.length + interns.length > 0)) {
    [employees, interns] = await load();
  }

  const all = [...employees, ...interns];
  const checklists = await Promise.all(
    all.map(async (p) => ({
      startup: p.startup,
      ...(await onboarding.getChecklist(p.startupId, p.id)),
    }))
  );

  ok(res, checklists);
});

/** Upload one of their own documents. */
router.post(
  "/me/onboarding/:personId/documents",
  requireAuth,
  onboardingUpload.single("file"),
  async (req, res) => {
    if (!req.file) throw new AppError(400, "Attach a file", "FILE_REQUIRED");

    // Prove the record belongs to this user before touching it — personId comes
    // from the URL and must never be trusted on its own.
    const [employee, intern] = await Promise.all([
      prisma.employee.findFirst({ where: { id: req.params.personId as string, userId: req.user!.id } }),
      prisma.intern.findFirst({ where: { id: req.params.personId as string, userId: req.user!.id } }),
    ]);
    const owned = employee ?? intern;
    if (!owned) throw new AppError(404, "Record not found", "NOT_FOUND");

    ok(
      res,
      await onboarding.uploadDocument({
        startupId: owned.startupId,
        personId: owned.id,
        docType: req.body.docType,
        file: req.file,
        actorId: req.user!.id,
      }),
      201
    );
  }
);

/**
 * ── The intern's own attendance ──────────────────────
 *
 * Every route below resolves the intern record from the signed-in user, never
 * from a path parameter, so one intern cannot read or mark another's day.
 * None of it returns stipend figures: what someone is owed is founder-only and
 * lives under /api/w/:code/finance.
 */
async function myInternships(userId: string) {
  return prisma.intern.findMany({
    where: { userId, status: { in: ["ACTIVE", "NOTICE"] } },
    select: {
      id: true, internCode: true, designation: true, officeDays: true,
      department: true, college: true, startDate: true, endDate: true, status: true,
      startup: { select: { name: true, code: true, logoUrl: true } },
    },
  });
}

/** One card per active internship — normally exactly one. */
router.get("/me/attendance", requireAuth, async (req, res) => {
  let internships = await myInternships(req.user!.id);
  if (await claimIfEmpty(req.user!.id, req.user!.email, internships.length > 0)) {
    internships = await myInternships(req.user!.id);
  }
  ok(
    res,
    await Promise.all(
      internships.map(async (i) => ({
        internId: i.id,
        internCode: i.internCode,
        designation: i.designation,
        department: i.department,
        college: i.college,
        status: i.status,
        startup: i.startup,
        officeDays: i.officeDays,
        startDate: i.startDate,
        endDate: i.endDate,
        today: await internAttendance.today(i.id, req.user!.id),
      }))
    )
  );
});

router.post("/me/attendance/:internId/check-in", requireAuth, async (req, res) => {
  ok(
    res,
    await internAttendance.checkIn({
      internId: req.params.internId as string,
      userId: req.user!.id,
      note: req.body?.note,
    }),
    201
  );
});

router.post("/me/attendance/:internId/check-out", requireAuth, async (req, res) => {
  ok(
    res,
    await internAttendance.checkOut({
      internId: req.params.internId as string,
      userId: req.user!.id,
      note: req.body?.note,
    })
  );
});

/**
 * Documents issued TO the signed-in person — offer letter, certificates, ID
 * card, experience letter.
 *
 * Distinct from /me/onboarding, which is documents they upload. Scoped by their
 * own employee, intern and application records, so the query itself is the
 * permission check: nobody can name someone else's document.
 */
router.get("/me/documents", requireAuth, async (req, res) => {
  const [employees, interns, applications] = await Promise.all([
    prisma.employee.findMany({ where: { userId: req.user!.id }, select: { id: true } }),
    prisma.intern.findMany({ where: { userId: req.user!.id }, select: { id: true } }),
    prisma.jobApplication.findMany({ where: { userId: req.user!.id }, select: { id: true } }),
  ]);

  const employeeIds = employees.map((e) => e.id);
  const internIds = interns.map((i) => i.id);
  const applicationIds = applications.map((a) => a.id);
  if (!employeeIds.length && !internIds.length && !applicationIds.length) return ok(res, []);

  const docs = await prisma.hrDocument.findMany({
    where: {
      // Revoked letters are withheld — a withdrawn offer must not stay
      // downloadable as though it still stood.
      revokedAt: null,
      OR: [
        ...(employeeIds.length ? [{ employeeId: { in: employeeIds } }] : []),
        ...(internIds.length ? [{ internId: { in: internIds } }] : []),
        ...(applicationIds.length ? [{ applicationId: { in: applicationIds } }] : []),
      ],
    },
    select: {
      id: true,
      docType: true,
      documentNo: true,
      pdfUrl: true,
      issuedAt: true,
      payload: true,
      startup: { select: { name: true, code: true, logoUrl: true } },
    },
    orderBy: { issuedAt: "desc" },
  });

  ok(
    res,
    docs.map((d) => {
      const p = (d.payload ?? {}) as Record<string, unknown>;
      return {
        id: d.id,
        docType: d.docType,
        documentNo: d.documentNo,
        pdfUrl: d.pdfUrl,
        issuedAt: d.issuedAt,
        startup: d.startup,
        designation: p.designation ?? null,
      };
    })
  );
});

/** Their own month — days, statuses and attendance percentage. No money. */
router.get("/me/attendance/:internId/month", requireAuth, async (req, res) => {
  const now = new Date();
  ok(
    res,
    await internAttendance.month({
      internId: req.params.internId as string,
      userId: req.user!.id,
      year: Number(req.query.year ?? now.getUTCFullYear()),
      month: Number(req.query.month ?? now.getUTCMonth() + 1),
    })
  );
});

/** Workspaces the signed-in user can access — drives the workspace switcher. */
router.get("/me/workspaces", requireAuth, async (req, res) => {
  if (req.user!.role === "SUPER_ADMIN" || req.user!.role === "ADMIN") {
    const all = await prisma.startup.findMany({
      where: { isActive: true, code: { not: null } },
      select: { id: true, name: true, code: true, logoUrl: true },
      orderBy: { name: "asc" },
    });
    return ok(res, all.map((s) => ({ ...s, role: "SUPER_ADMIN" })));
  }

  /**
   * Staff roles only. Interns and employees hold a membership so their records
   * are tenant-scoped, but the workspace is a hiring tool — listing it here put
   * an intern one click from the applicant pipeline.
   */
  const STAFF_ROLES = ["FOUNDER", "OWNER", "ADMIN", "HR", "RECRUITER", "MANAGER"] as const;

  const load = () =>
    prisma.startupMember.findMany({
      where: { userId: req.user!.id, status: "ACTIVE", role: { in: [...STAFF_ROLES] } },
      select: {
        role: true,
        startup: { select: { id: true, name: true, code: true, logoUrl: true, isActive: true } },
      },
    });

  let memberships = await load();

  // Direct hires are parked at INVITED with no userId until they sign up. Test
  // against *any* membership, not just staff ones — an intern legitimately has
  // zero workspaces, and claiming on every one of their requests would be a
  // wasted write on every dashboard load.
  if (memberships.length === 0) {
    const anyMembership = await prisma.startupMember.count({ where: { userId: req.user!.id } });
    if (await claimIfEmpty(req.user!.id, req.user!.email, anyMembership > 0)) {
      memberships = await load();
    }
  }

  ok(
    res,
    memberships
      .filter((m) => m.startup.isActive && m.startup.code)
      .map((m) => ({ ...m.startup, role: m.role }))
  );
});

export default router;
