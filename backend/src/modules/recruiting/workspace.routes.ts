import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { resolveTenant, requireTenantRank } from "../../middleware/tenant";
import { validate } from "../../middleware/validate";
import { ApplicationsController } from "./applications/applications.controller";
import { transitionSchema, rejectSchema } from "./applications/applications.schema";
import * as jobs from "./jobs/tenantJobs.service";
import * as interviews from "./interviews/interviews.service";
import * as offers from "./offers/offers.service";
import * as documents from "../hrms/documents/document.service";
import * as issuance from "../hrms/documents/issuance.service";
import * as attendance from "../hrms/attendance/attendance.service";
import * as internAttendance from "../hrms/attendance/intern.service";
import * as stipend from "../hrms/finance/stipend.service";
import * as performance from "../hrms/performance/performance.service";
import * as analytics from "../analytics/analytics.service";
import * as onboarding from "../hrms/onboarding/onboarding.service";
import { createDirectHire, bulkDirectHire } from "../hrms/onboarding/directHire.service";
import * as people from "../hrms/people/people.service";
import { audit, AuditAction } from "../shared/audit.service";
import multer from "multer";
import { env } from "../../config/env";
import { AppError } from "../../middleware/errorHandler";

/** Identity and education documents joiners upload — images or PDFs. */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router({ mergeParams: true });
const applications = new ApplicationsController();
const ok = (res: any, data: unknown, status = 200) => res.status(status).json({ success: true, data });

/**
 * Every route below is tenant-scoped: membership is proven once, and req.db is
 * hard-filtered to that startup for the remainder of the request.
 *
 * MANAGER is the floor for the entire workspace. This is a staff tool — hiring
 * funnels, applicant names, salary bands, colleagues' records. Interns and
 * employees are members of the tenant too, and without this floor an intern
 * reached the dashboard, the analytics and the job list, because those handlers
 * carried no rank check of their own. Their own attendance and documents live
 * under /api/me, which is scoped to them personally.
 */
router.use("/:code", requireAuth, resolveTenant, requireTenantRank("MANAGER"));

// ── Dashboard & analytics ────────────────────────────
router.get("/:code/dashboard", async (req, res) => {
  ok(res, await analytics.tenantDashboard(req.db, req.startupId!));
});
router.get("/:code/analytics/trends", async (req, res) => {
  ok(res, await analytics.tenantTrends(req.startupId!, Number(req.query.months) || 6));
});
router.get("/:code/analytics/colleges", async (req, res) => {
  ok(res, await analytics.tenantColleges(req.startupId!));
});

// ── Jobs ─────────────────────────────────────────────
const jobBody = z.object({
  body: z.object({
    title: z.string().min(2).max(160),
    description: z.string().min(10),
    type: z.enum(["INTERNSHIP", "FULL_TIME", "PART_TIME", "CONTRACT"]),
    domain: z.string().min(1),
    department: z.string().max(120).optional(),
    workMode: z.enum(["REMOTE", "HYBRID", "OFFICE"]).optional(),
    location: z.string().min(1),
    isRemote: z.coerce.boolean().optional(),
    skills: z.array(z.string()).optional().default([]),
    responsibilities: z.array(z.string()).optional().default([]),
    requiredSkills: z.array(z.string()).optional().default([]),
    preferredSkills: z.array(z.string()).optional().default([]),
    openings: z.coerce.number().int().min(1).optional(),
    durationMonths: z.coerce.number().int().min(1).max(48).optional(),
    stipend: z.string().optional(),
    salaryRange: z.string().optional(),
    deadline: z.coerce.date().optional(),
    hiringManagerId: z.string().uuid().optional(),
    status: z.enum(["DRAFT", "OPEN", "PAUSED", "CLOSED", "FILLED"]).optional(),
  }),
});

router.get("/:code/jobs", async (req, res) => {
  ok(res, await jobs.list(req.db, req.query.status as string));
});
router.get("/:code/jobs/:id", async (req, res) => {
  ok(res, await jobs.getOne(req.db, req.params.id as string));
});
router.post("/:code/jobs", requireTenantRank("RECRUITER"), validate(jobBody), async (req, res) => {
  ok(res, await jobs.create(req.db, req.startupId!, req.user!.id, req.body), 201);
});
router.patch("/:code/jobs/:id", requireTenantRank("RECRUITER"), async (req, res) => {
  ok(res, await jobs.update(req.db, req.startupId!, req.params.id as string, req.user!.id, req.body));
});
router.post("/:code/jobs/:id/publish", requireTenantRank("HR"), async (req, res) => {
  ok(res, await jobs.publish(req.db, req.startupId!, req.params.id as string, req.user!.id));
});
router.post("/:code/jobs/:id/close", requireTenantRank("HR"), async (req, res) => {
  ok(
    res,
    await jobs.close(req.db, req.startupId!, req.params.id as string, req.user!.id, {
      force: req.query.force === "true",
      reason: req.body?.reason,
    })
  );
});

// ── Applications & pipeline ──────────────────────────
router.get("/:code/applications", requireTenantRank("MANAGER"), (req, res) => applications.list(req, res));
router.get("/:code/applications/board", requireTenantRank("MANAGER"), (req, res) => applications.board(req, res));
router.get("/:code/applications/:id", requireTenantRank("MANAGER"), (req, res) => applications.getOne(req, res));
router.post(
  "/:code/applications/:id/transition",
  requireTenantRank("RECRUITER"),
  validate(transitionSchema),
  (req, res) => applications.transition(req, res)
);
router.post(
  "/:code/applications/:id/reject",
  requireTenantRank("RECRUITER"),
  validate(rejectSchema),
  (req, res) => applications.reject(req, res)
);

// ── Interviews ───────────────────────────────────────
const interviewBody = z.object({
  body: z.object({
    stage: z.enum(["HR_ROUND", "TECHNICAL_ROUND", "ASSIGNMENT", "FINAL_INTERVIEW"]),
    scheduledAt: z.coerce.date(),
    durationMins: z.coerce.number().int().min(10).max(480).optional(),
    timezone: z.string().optional(),
    mode: z.enum(["ONLINE", "OFFLINE", "PHONE"]).optional(),
    meetingUrl: z.string().url().optional().or(z.literal("")),
    location: z.string().optional(),
    panelUserIds: z.array(z.string().uuid()).optional(),
  }),
});

router.get("/:code/interviews", requireTenantRank("MANAGER"), async (req, res) => {
  ok(res, await interviews.listUpcoming(req.db));
});
router.post(
  "/:code/applications/:id/interviews",
  requireTenantRank("RECRUITER"),
  validate(interviewBody),
  async (req, res) => {
    ok(
      res,
      await interviews.schedule({
        startupId: req.startupId!,
        startupCode: req.startup?.code ?? null,
        applicationId: req.params.id as string,
        actorId: req.user!.id,
        ...req.body,
      }),
      201
    );
  }
);
router.patch("/:code/interviews/:id", requireTenantRank("RECRUITER"), async (req, res) => {
  ok(res, await interviews.update(req.db, req.params.id as string, req.startupId!, req.user!.id, req.body));
});
router.post(
  "/:code/interviews/:id/feedback",
  requireTenantRank("MANAGER"),
  validate(
    z.object({
      body: z.object({
        rating: z.coerce.number().int().min(1).max(5),
        recommend: z.enum(["STRONG_YES", "YES", "NEUTRAL", "NO", "STRONG_NO"]),
        strengths: z.string().max(2000).optional(),
        concerns: z.string().max(2000).optional(),
        notes: z.string().max(4000).optional(),
      }),
    })
  ),
  async (req, res) => {
    ok(
      res,
      await interviews.submitFeedback({
        db: req.db,
        startupId: req.startupId!,
        interviewId: req.params.id as string,
        reviewerId: req.user!.id,
        ...req.body,
      }),
      201
    );
  }
);

// ── Offers & onboarding ──────────────────────────────
router.post(
  "/:code/applications/:id/offer",
  requireTenantRank("HR"),
  validate(
    z.object({
      body: z.object({
        designation: z.string().min(2).max(120),
        department: z.string().max(120).optional(),
        ctc: z.string().max(60).optional(),
        stipend: z.string().max(60).optional(),
        joiningDate: z.coerce.date(),
        // Optional: the service derives "two days before joining" when omitted,
        // which is the rule we actually want. Only pass it to override.
        expiresAt: z.coerce.date().optional(),
      }),
    })
  ),
  async (req, res) => {
    const result = await offers.generate({
      startupId: req.startupId!,
      startupCode: req.startup?.code ?? "GEN",
      applicationId: req.params.id as string,
      actorId: req.user!.id,
      ...req.body,
    });
    ok(res, result, result.created ? 201 : 200);
  }
);

router.post("/:code/offers/:id/revoke", requireTenantRank("ADMIN"), async (req, res) => {
  ok(res, await offers.revoke(req.startupId!, req.params.id as string, req.body?.reason ?? "", req.user!.id));
});

router.post("/:code/applications/:id/onboard", requireTenantRank("HR"), async (req, res) => {
  ok(
    res,
    await offers.onboard({
      startupId: req.startupId!,
      startupCode: req.startup?.code ?? "GEN",
      applicationId: req.params.id as string,
      actorId: req.user!.id,
      department: req.body?.department,
      managerId: req.body?.managerId,
    }),
    201
  );
});

// ── People ───────────────────────────────────────────
router.get("/:code/employees", requireTenantRank("MANAGER"), async (req, res) => {
  ok(res, await req.db!.employee.findMany({ orderBy: { joinedAt: "desc" } }));
});
router.get("/:code/interns", requireTenantRank("MANAGER"), async (req, res) => {
  ok(res, await req.db!.intern.findMany({ orderBy: { startDate: "desc" } }));
});

// ── Attendance ───────────────────────────────────────
router.get("/:code/attendance", requireTenantRank("MANAGER"), async (req, res) => {
  ok(res, await attendance.forDate(req.db, (req.query.date as string) ?? new Date()));
});

router.post(
  "/:code/attendance",
  requireTenantRank("MANAGER"),
  validate(
    z.object({
      body: z.object({
        employeeId: z.string().uuid(),
        date: z.string(),
        status: z.enum(attendance.ATTENDANCE_STATUS),
        checkIn: z.string().optional(),
        checkOut: z.string().optional(),
        note: z.string().max(500).optional(),
      }),
    })
  ),
  async (req, res) => {
    ok(res, await attendance.mark({ db: req.db, startupId: req.startupId!, actorId: req.user!.id, ...req.body }), 201);
  }
);

router.post(
  "/:code/attendance/bulk",
  requireTenantRank("MANAGER"),
  validate(
    z.object({
      body: z.object({
        date: z.string(),
        entries: z
          .array(z.object({ employeeId: z.string().uuid(), status: z.enum(attendance.ATTENDANCE_STATUS) }))
          .min(1)
          .max(500),
      }),
    })
  ),
  async (req, res) => {
    ok(res, await attendance.bulkMark({ db: req.db, startupId: req.startupId!, actorId: req.user!.id, ...req.body }));
  }
);

router.get("/:code/attendance/employee/:employeeId", requireTenantRank("MANAGER"), async (req, res) => {
  const now = new Date();
  ok(
    res,
    await attendance.monthly(
      req.db,
      req.params.employeeId as string,
      Number(req.query.year) || now.getFullYear(),
      Number(req.query.month) || now.getMonth() + 1
    )
  );
});

// ── Performance reviews ──────────────────────────────
router.get("/:code/performance", requireTenantRank("MANAGER"), async (req, res) => {
  ok(res, await performance.list(req.db, req.query.employeeId as string | undefined));
});

router.get("/:code/performance/summary", requireTenantRank("MANAGER"), async (req, res) => {
  ok(res, await performance.summary(req.db));
});

router.post(
  "/:code/performance",
  requireTenantRank("MANAGER"),
  validate(
    z.object({
      body: z.object({
        employeeId: z.string().uuid(),
        periodStart: z.string(),
        periodEnd: z.string(),
        rating: z.coerce.number().int().min(1).max(5),
        strengths: z.string().max(4000).optional(),
        improvements: z.string().max(4000).optional(),
        goals: z.string().max(4000).optional(),
        submit: z.boolean().optional(),
      }),
    })
  ),
  async (req, res) => {
    ok(
      res,
      await performance.create({ db: req.db, startupId: req.startupId!, reviewerId: req.user!.id, ...req.body }),
      201
    );
  }
);

router.patch("/:code/performance/:id", requireTenantRank("MANAGER"), async (req, res) => {
  ok(
    res,
    await performance.update({
      db: req.db,
      startupId: req.startupId!,
      id: req.params.id as string,
      actorId: req.user!.id,
      data: req.body,
    })
  );
});

// ── Onboarding: direct hires & document collection ───

const directHireBody = z.object({
  body: z.object({
    fullName: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().max(20).optional(),
    designation: z.string().min(2).max(120),
    department: z.string().max(120).optional(),
    employmentType: z.enum(["INTERNSHIP", "FULL_TIME", "PART_TIME", "CONTRACT"]),
    joinedAt: z.string(),
    endDate: z.string().optional(),
    college: z.string().max(200).optional(),
    ctc: z.string().max(60).optional(),
    stipend: z.string().max(60).optional(),
    managerId: z.string().uuid().optional(),
    requestDocuments: z.boolean().optional(),
    issueOfferLetter: z.boolean().optional(),
    workMode: z.enum(["REMOTE", "HYBRID", "OFFICE"]).optional(),
    location: z.string().max(160).optional(),
  }),
});

/** Add someone hired outside the pipeline — the pre-existing team. */
router.post("/:code/team/direct-hire", requireTenantRank("HR"), validate(directHireBody), async (req, res) => {
  ok(
    res,
    await createDirectHire({
      startupId: req.startupId!,
      startupCode: req.startup?.code ?? "GEN",
      actorId: req.user!.id,
      ...req.body,
    }),
    201
  );
});

/** Bulk import for the team that predates this system. */
router.post(
  "/:code/team/bulk-import",
  requireTenantRank("ADMIN"),
  validate(
    z.object({
      body: z.object({
        requestDocuments: z.boolean().optional(),
        rows: z.array(directHireBody.shape.body).min(1).max(200),
      }),
    })
  ),
  async (req, res) => {
    ok(
      res,
      await bulkDirectHire({
        startupId: req.startupId!,
        startupCode: req.startup?.code ?? "GEN",
        actorId: req.user!.id,
        rows: req.body.rows,
        requestDocuments: req.body.requestDocuments,
      })
    );
  }
);

// ── People: full record, edit, remove ────────────────
router.get("/:code/team/:personId", requireTenantRank("MANAGER"), async (req, res) => {
  ok(res, await people.getPerson(req.startupId!, req.params.personId as string));
});

router.patch("/:code/team/:personId", requireTenantRank("HR"), async (req, res) => {
  ok(
    res,
    await people.updatePerson({
      startupId: req.startupId!,
      personId: req.params.personId as string,
      actorId: req.user!.id,
      data: req.body ?? {},
    })
  );
});

/** Removing someone is Admin-only — it destroys their uploaded documents too. */
router.delete("/:code/team/:personId", requireTenantRank("ADMIN"), async (req, res) => {
  ok(
    res,
    await people.deletePerson({
      startupId: req.startupId!,
      personId: req.params.personId as string,
      actorId: req.user!.id,
      force: req.query.force === "true",
    })
  );
});

router.get("/:code/onboarding", requireTenantRank("HR"), async (req, res) => {
  ok(res, await onboarding.pendingOnboarding(req.startupId!));
});

router.get("/:code/onboarding/:personId", requireTenantRank("HR"), async (req, res) => {
  ok(res, await onboarding.getChecklist(req.startupId!, req.params.personId as string));
});

router.post(
  "/:code/onboarding/:personId/documents",
  requireTenantRank("HR"),
  upload.single("file"),
  async (req, res) => {
    if (!req.file) throw new AppError(400, "Attach a file", "FILE_REQUIRED");
    ok(
      res,
      await onboarding.uploadDocument({
        startupId: req.startupId!,
        personId: req.params.personId as string,
        docType: req.body.docType,
        file: req.file,
        actorId: req.user!.id,
      }),
      201
    );
  }
);

router.post(
  "/:code/onboarding/documents/:documentId/review",
  requireTenantRank("HR"),
  validate(
    z.object({
      body: z.object({
        approve: z.boolean(),
        reason: z.string().max(500).optional(),
      }),
    })
  ),
  async (req, res) => {
    ok(
      res,
      await onboarding.reviewDocument({
        startupId: req.startupId!,
        documentId: req.params.documentId as string,
        approve: req.body.approve,
        reason: req.body.reason,
        actorId: req.user!.id,
      })
    );
  }
);

router.post("/:code/onboarding/:personId/request-documents", requireTenantRank("HR"), async (req, res) => {
  ok(
    res,
    await onboarding.requestDocuments({
      startupId: req.startupId!,
      personId: req.params.personId as string,
      actorId: req.user!.id,
    })
  );
});

// ── HR documents ─────────────────────────────────────
router.get("/:code/documents", requireTenantRank("HR"), async (req, res) => {
  ok(res, await documents.list(req.db, req.query.docType as never));
});

router.post(
  "/:code/documents/issue",
  requireTenantRank("HR"),
  validate(
    z.object({
      body: z.object({
        docType: z.enum(["EXPERIENCE_LETTER", "LOR", "CERTIFICATE", "ID_CARD", "RELIEVING"]),
        employeeId: z.string().uuid().optional(),
        internId: z.string().uuid().optional(),
        extra: z.record(z.string(), z.any()).optional(),
      }),
    })
  ),
  async (req, res) => {
    ok(
      res,
      await issuance.issueDocument({
        startupId: req.startupId!,
        startupCode: req.startup?.code ?? "GEN",
        actorId: req.user!.id,
        ...req.body,
      }),
      201
    );
  }
);

/**
 * Rebuild the file for a document issued without one, and optionally re-send it.
 * Keeps the original number — the letter is unchanged, only its file was missing.
 */
router.post("/:code/documents/:id/regenerate", requireTenantRank("HR"), async (req, res) => {
  ok(res, await documents.regenerateFile(req.startupId!, req.params.id as string));
});

router.post("/:code/documents/:id/revoke", requireTenantRank("ADMIN"), async (req, res) => {
  ok(res, await documents.revoke(req.startupId!, req.params.id as string, req.body?.reason ?? "", req.user!.id));
});

router.post(
  "/:code/employees/:id/exit",
  requireTenantRank("HR"),
  validate(
    z.object({
      body: z.object({
        exitedAt: z.string(),
        status: z.enum(["EXITED", "TERMINATED"]).optional(),
      }),
    })
  ),
  async (req, res) => {
    ok(
      res,
      await issuance.recordExit({
        db: req.db,
        startupId: req.startupId!,
        employeeId: req.params.id as string,
        actorId: req.user!.id,
        ...req.body,
      })
    );
  }
);

// ── Intern attendance (HR and above) ─────────────────
router.get("/:code/attendance/interns", requireTenantRank("HR"), async (req, res) => {
  ok(res, await internAttendance.rosterFor(req.startupId!, (req.query.date as string) ?? new Date()));
});

router.get("/:code/attendance/interns/:internId", requireTenantRank("HR"), async (req, res) => {
  const now = new Date();
  ok(
    res,
    await internAttendance.month({
      internId: req.params.internId as string,
      year: Number(req.query.year ?? now.getUTCFullYear()),
      month: Number(req.query.month ?? now.getUTCMonth() + 1),
    })
  );
});

router.post(
  "/:code/attendance/interns/:internId/mark",
  requireTenantRank("HR"),
  validate(
    z.object({
      body: z.object({
        date: z.string(),
        status: z.enum(["PRESENT", "LATE", "HALF_DAY", "ABSENT", "LEAVE", "HOLIDAY"]),
        note: z.string().max(300).optional(),
      }),
    })
  ),
  async (req, res) => {
    ok(
      res,
      await internAttendance.markForIntern({
        startupId: req.startupId!,
        internId: req.params.internId as string,
        date: req.body.date,
        status: req.body.status,
        note: req.body.note,
        actorId: req.user!.id,
      })
    );
  }
);

router.put(
  "/:code/attendance/interns/:internId/office-days",
  requireTenantRank("HR"),
  validate(z.object({ body: z.object({ officeDays: z.array(z.number().int().min(1).max(7)) }) })),
  async (req, res) => {
    ok(
      res,
      await internAttendance.setOfficeDays({
        startupId: req.startupId!,
        internId: req.params.internId as string,
        officeDays: req.body.officeDays,
        actorId: req.user!.id,
      })
    );
  }
);

/**
 * ── Finance ──────────────────────────────────────────
 * Founder and above only. What each person is owed is not something HR,
 * recruiters or mentors should see by default, and it is never exposed on any
 * intern-facing route.
 */
const period = (req: { query: Record<string, unknown> }) => {
  const now = new Date();
  return {
    year: Number(req.query.year ?? now.getUTCFullYear()),
    month: Number(req.query.month ?? now.getUTCMonth() + 1),
  };
};

router.get("/:code/finance/stipends", requireTenantRank("FOUNDER"), async (req, res) => {
  ok(res, await stipend.monthSheet({ startupId: req.startupId!, ...period(req) }));
});

router.post(
  "/:code/finance/stipends/:internId/approve",
  requireTenantRank("FOUNDER"),
  validate(
    z.object({
      body: z.object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
        adjustment: z.number().int().optional(),
        adjustmentNote: z.string().max(300).optional(),
      }),
    })
  ),
  async (req, res) => {
    ok(
      res,
      await stipend.approve({
        startupId: req.startupId!,
        internId: req.params.internId as string,
        year: req.body.year,
        month: req.body.month,
        adjustment: req.body.adjustment,
        adjustmentNote: req.body.adjustmentNote,
        actorId: req.user!.id,
      }),
      201
    );
  }
);

router.post(
  "/:code/finance/stipends/approve-month",
  requireTenantRank("FOUNDER"),
  validate(z.object({ body: z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }) })),
  async (req, res) => {
    ok(
      res,
      await stipend.approveMonth({
        startupId: req.startupId!,
        year: req.body.year,
        month: req.body.month,
        actorId: req.user!.id,
      })
    );
  }
);

router.post("/:code/finance/stipends/:payoutId/paid", requireTenantRank("FOUNDER"), async (req, res) => {
  ok(
    res,
    await stipend.markPaid({
      startupId: req.startupId!,
      payoutId: req.params.payoutId as string,
      paymentRef: req.body?.paymentRef,
      actorId: req.user!.id,
    })
  );
});

router.put(
  "/:code/finance/interns/:internId/stipend",
  requireTenantRank("FOUNDER"),
  validate(z.object({ body: z.object({ amount: z.number().int().min(0) }) })),
  async (req, res) => {
    ok(
      res,
      await stipend.setStipendAmount({
        startupId: req.startupId!,
        internId: req.params.internId as string,
        amount: req.body.amount,
        actorId: req.user!.id,
      })
    );
  }
);

// ── Branding ─────────────────────────────────────────
const brandingBody = z.object({
  body: z.object({
    legalName: z.string().min(2),
    addressLine1: z.string().min(2),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(4).max(10),
    logoUrl: z.string().url().optional().or(z.literal("")),
    cin: z.string().max(30).optional().or(z.literal("")),
    signatoryName: z.string().min(2),
    signatoryTitle: z.string().min(2),
    signatureImageUrl: z.string().url().optional().or(z.literal("")),
    signatoryOrg: z.string().max(120).optional().or(z.literal("")),
    // Second signatory — partners countersign their own letters.
    cosignatoryName: z.string().max(120).optional().or(z.literal("")),
    cosignatoryTitle: z.string().max(120).optional().or(z.literal("")),
    cosignatoryOrg: z.string().max(120).optional().or(z.literal("")),
    cosignatureImageUrl: z.string().url().optional().or(z.literal("")),
    primaryColor: z.string().max(9).optional(),
  }),
});

router.get("/:code/branding", requireTenantRank("ADMIN"), async (req, res) => {
  ok(res, await req.db!.startupBranding.findFirst({}));
});
router.put("/:code/branding", requireTenantRank("ADMIN"), validate(brandingBody), async (req, res) => {
  const existing = await req.db!.startupBranding.findFirst({});
  const saved = existing
    ? await req.db!.startupBranding.update({ where: { id: existing.id }, data: req.body })
    : await req.db!.startupBranding.create({ data: req.body });

  await audit({
    action: AuditAction.BRANDING_UPDATED,
    entity: "StartupBranding",
    entityId: saved.id,
    actorId: req.user!.id,
    startupId: req.startupId!,
  });

  ok(res, saved);
});

export default router;
