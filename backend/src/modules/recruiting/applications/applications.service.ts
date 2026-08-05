import { PipelineStage, Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { nextApplicationNo } from "../../../lib/numbering";
import { uploadFile } from "../../../lib/storage";
import { env } from "../../../config/env";
import { audit, AuditAction } from "../../shared/audit.service";
import { notify, notifyTenantRoles } from "../../shared/notification.service";
import { Emails } from "../../../lib/email/templates";
import { canApply } from "../../profile/completeness";
import * as pipeline from "../pipeline/pipeline.service";

const HIRING_ROLES = ["FOUNDER", "OWNER", "ADMIN", "HR", "RECRUITER"];

export interface ApplyInput {
  jobId: string;
  userId: string;
  coverLetter?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  // FormData sends these as strings; JSON clients send real types.
  skills?: string[] | string;
  college?: string;
  cgpa?: number | string;
  experienceYears?: number | string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
}

/**
 * Skills arrive in several shapes depending on the client: a real array from
 * JSON, a JSON string from FormData, or a comma-separated string. validate()
 * checks the schema but does not write transformed values back to req.body, so
 * whatever the caller sent reaches this service untouched — normalise here.
 */
function normaliseSkills(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== "string") return [];

  const raw = value.trim();
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // fall through to comma splitting
    }
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

const toDecimal = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? new Prisma.Decimal(n) : null;
};

/** Student-facing. Not tenant-scoped — the tenant is derived from the job. */
export async function apply(input: ApplyInput, resume?: Express.Multer.File) {
  const job = await prisma.job.findUnique({
    where: { id: input.jobId },
    include: { startup: { select: { id: true, code: true, name: true, logoUrl: true } } },
  });
  if (!job) throw new AppError(404, "Job not found", "NOT_FOUND");

  if (job.status !== "OPEN") {
    throw new AppError(409, "This role is not accepting applications", "JOB_NOT_OPEN");
  }
  if (job.deadline && job.deadline < new Date()) {
    throw new AppError(409, "The deadline for this role has passed", "DEADLINE_PASSED");
  }

  const existing = await prisma.jobApplication.findUnique({
    where: { jobId_userId: { jobId: input.jobId, userId: input.userId } },
    select: { id: true, applicationNo: true },
  });
  if (existing) {
    throw new AppError(409, "You have already applied to this role", "DUPLICATE_APPLICATION");
  }

  // Gate on the profile, not on what happens to be typed into this one form.
  // Enforced here rather than only in the UI, since the endpoint is public API.
  const profileForCheck = await prisma.profile.findUnique({ where: { userId: input.userId } });
  const eligibility = canApply({
    ...profileForCheck,
    // A resume attached to this application satisfies the resume requirement
    // even if the profile has none saved yet.
    resumeUrl: profileForCheck?.resumeUrl ?? (resume ? "attached" : null),
  } as Record<string, unknown>);

  if (!eligibility.eligible) {
    throw new AppError(
      422,
      eligibility.reason ?? "Complete your profile before applying.",
      "PROFILE_INCOMPLETE"
    );
  }

  // Upload before the transaction: object storage is not transactional, so a
  // failed upload must abort before any row is written.
  let resumeUrl: string | undefined;
  if (resume) {
    resumeUrl = await uploadFile(
      env.STORAGE_BUCKET_RESUMES,
      `${job.startup.id}/${input.userId}/${Date.now()}-${resume.originalname}`,
      resume.buffer,
      resume.mimetype
    );
  }

  const profile = profileForCheck;
  const user = await prisma.user.findUnique({ where: { id: input.userId } });

  const application = await prisma.$transaction(async (tx) => {
    const applicationNo = await nextApplicationNo(tx, job.startup.id, job.startup.code ?? "GEN");

    const created = await tx.jobApplication.create({
      data: {
        jobId: job.id,
        userId: input.userId,
        startupId: job.startup.id,
        applicationNo,
        stage: "APPLIED",
        resumeUrl: resumeUrl ?? profile?.resumeUrl,
        coverLetter: input.coverLetter,
        portfolioUrl: input.portfolioUrl ?? profile?.portfolioUrl,
        githubUrl: input.githubUrl ?? profile?.githubUrl,
        linkedinUrl: input.linkedinUrl ?? profile?.linkedinUrl,
        // Everything falls back to the profile, so a startup always receives the
        // full picture even when the apply form only asked for a few fields.
        skills: normaliseSkills(input.skills).length
          ? normaliseSkills(input.skills)
          : profile?.skills ?? [],
        college: input.college ?? profile?.college,
        cgpa: toDecimal(input.cgpa) ?? profile?.cgpa ?? null,
        experienceYears: toDecimal(input.experienceYears) ?? profile?.experienceYears ?? null,
        applicantName: input.applicantName ?? profile?.name,
        applicantEmail: input.applicantEmail ?? user?.email,
        applicantPhone: input.applicantPhone ?? profile?.phone,
      },
    });

    await tx.applicationStageEvent.create({
      data: {
        startupId: job.startup.id,
        applicationId: created.id,
        fromStage: null,
        toStage: "APPLIED",
        actorId: input.userId,
      },
    });

    await audit(
      {
        action: AuditAction.APPLICATION_SUBMITTED,
        entity: "JobApplication",
        entityId: created.id,
        actorId: input.userId,
        startupId: job.startup.id,
        metadata: { applicationNo, jobTitle: job.title },
      },
      tx
    );

    return created;
  });

  await notify({
    userId: input.userId,
    event: "APPLICATION_SUBMITTED",
    title: `Application received — ${job.title}`,
    message: `Your application to ${job.startup.name} was received. Reference ${application.applicationNo}.`,
    link: `/dashboard/applications/${application.id}`,
    html: Emails.applicationSubmitted({
      name: application.applicantName ?? "there",
      jobTitle: job.title,
      startupName: job.startup.name,
      applicationNo: application.applicationNo ?? "",
      applicationId: application.id,
      logoUrl: job.startup.logoUrl,
    }),
  });

  /**
   * In-app and push only. A popular role draws applications all day, and every
   * founder, admin, HR and recruiter on the startup would otherwise get an email
   * for each one — the fastest way to make people mute the whole channel. They
   * see it on the applicants board, which is where they act on it anyway.
   */
  await notifyTenantRoles(job.startup.id, HIRING_ROLES, {
    event: "APPLICATION_RECEIVED",
    channel: "inapp",
    title: `New applicant for ${job.title}`,
    message: `${application.applicantName ?? "A candidate"} applied (${application.applicationNo}).`,
    link: `/s/${job.startup.code}/applications/${application.id}`,
  });

  return application;
}

export interface ListFilters {
  stage?: PipelineStage;
  jobId?: string;
  college?: string;
  q?: string;
  includeClosed?: boolean;
  page?: number;
  limit?: number;
}

/** Tenant-scoped list. `db` is already hard-filtered to the caller's startup. */
export async function list(db: any, filters: ListFilters) {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Number(filters.limit) || 25);

  const where: Prisma.JobApplicationWhereInput = {};
  if (filters.stage) where.stage = filters.stage;
  if (filters.jobId) where.jobId = filters.jobId;
  if (filters.college) where.college = { contains: filters.college, mode: "insensitive" };
  if (!filters.includeClosed) where.outcome = null;
  if (filters.q) {
    where.OR = [
      { applicantName: { contains: filters.q, mode: "insensitive" } },
      { applicantEmail: { contains: filters.q, mode: "insensitive" } },
      { applicationNo: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.jobApplication.findMany({
      where,
      orderBy: { appliedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        job: { select: { id: true, title: true, department: true, type: true } },
        _count: { select: { interviews: true } },
      },
    }),
    db.jobApplication.count({ where }),
  ]);

  return { items, total, page, pages: Math.ceil(total / limit) };
}

/** Board view for the pipeline UI — one grouped query, not one per column. */
export async function board(db: any, jobId?: string) {
  const where: Prisma.JobApplicationWhereInput = { outcome: null };
  if (jobId) where.jobId = jobId;

  const grouped = await db.jobApplication.groupBy({
    by: ["stage"],
    where,
    _count: { _all: true },
  });

  const items = await db.jobApplication.findMany({
    where,
    orderBy: { appliedAt: "desc" },
    take: 500,
    select: {
      id: true,
      applicationNo: true,
      applicantName: true,
      college: true,
      stage: true,
      appliedAt: true,
      version: true,
      job: { select: { id: true, title: true } },
    },
  });

  const counts: Record<string, number> = {};
  for (const g of grouped) counts[g.stage] = g._count._all;

  return { counts, items };
}

export async function getOne(db: any, id: string) {
  const app = await db.jobApplication.findFirst({
    where: { id },
    include: {
      job: true,
      user: { select: { id: true, email: true, avatarUrl: true, profile: true } },
      events: { orderBy: { createdAt: "asc" }, include: { actor: { select: { id: true, email: true } } } },
      interviews: { orderBy: { scheduledAt: "desc" }, include: { feedback: true, panel: true } },
      offer: true,
    },
  });
  if (!app) throw new AppError(404, "Application not found", "NOT_FOUND");
  return app;
}

export async function transition(args: {
  startupId: string;
  applicationId: string;
  toStage: PipelineStage;
  version: number;
  note?: string;
  actorId: string;
  tenantRole: any;
}) {
  const result = await pipeline.transition({
    applicationId: args.applicationId,
    toStage: args.toStage,
    version: args.version,
    note: args.note,
    actorId: args.actorId,
    tenantRole: args.tenantRole,
    startupId: args.startupId,
  });

  await audit({
    action: AuditAction.APPLICATION_TRANSITIONED,
    entity: "JobApplication",
    entityId: args.applicationId,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { toStage: args.toStage, note: args.note },
  });

  if (result?.userId) {
    const ctx = await startupContext(args.startupId, result.jobId);
    await notify({
      userId: result.userId,
      event: args.toStage === "SELECTED" ? "SELECTED" : "STAGE_CHANGED",
      title:
        args.toStage === "SELECTED"
          ? "You have been selected"
          : "Your application moved forward",
      message: `Your application ${result.applicationNo} is now at: ${humanise(args.toStage)}.`,
      link: `/dashboard/applications/${args.applicationId}`,
      html:
        args.toStage === "SELECTED"
          ? Emails.selected({ name: result.applicantName ?? "there", jobTitle: ctx.jobTitle, startupName: ctx.startupName, logoUrl: ctx.logoUrl })
          : Emails.stageChanged({
              name: result.applicantName ?? "there",
              jobTitle: ctx.jobTitle,
              startupName: ctx.startupName,
              stage: humanise(args.toStage),
              applicationId: args.applicationId,
              logoUrl: ctx.logoUrl,
            }),
    });
  }

  return result;
}

export async function reject(args: {
  startupId: string;
  applicationId: string;
  reason: string;
  version: number;
  actorId: string;
}) {
  const result = await pipeline.close({
    applicationId: args.applicationId,
    outcome: "REJECTED",
    reason: args.reason,
    version: args.version,
    actorId: args.actorId,
    startupId: args.startupId,
  });

  await audit({
    action: AuditAction.APPLICATION_REJECTED,
    entity: "JobApplication",
    entityId: args.applicationId,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { reason: args.reason },
  });

  if (result?.userId) {
    const ctx = await startupContext(args.startupId, result.jobId);
    await notify({
      userId: result.userId,
      event: "REJECTED",
      title: "Update on your application",
      message: "Thank you for your interest. We will not be moving forward at this time.",
      link: `/dashboard/applications/${args.applicationId}`,
      html: Emails.rejected({
        name: result.applicantName ?? "there",
        jobTitle: ctx.jobTitle,
        startupName: ctx.startupName,
        logoUrl: ctx.logoUrl,
      }),
    });
  }

  return result;
}

/** Candidate-initiated. Ownership, not tenancy, is the check here. */
export async function withdraw(applicationId: string, userId: string) {
  const app = await prisma.jobApplication.findFirst({
    where: { id: applicationId, userId },
  });
  if (!app) throw new AppError(404, "Application not found", "NOT_FOUND");
  if (!app.startupId) throw new AppError(500, "Application is missing tenant", "DATA_ERROR");

  const result = await pipeline.close({
    applicationId,
    outcome: "WITHDRAWN",
    version: app.version,
    actorId: userId,
    startupId: app.startupId,
  });

  await audit({
    action: AuditAction.APPLICATION_WITHDRAWN,
    entity: "JobApplication",
    entityId: applicationId,
    actorId: userId,
    startupId: app.startupId,
  });

  return result;
}

/** A student's own applications across every startup. */
export async function myApplications(userId: string) {
  return prisma.jobApplication.findMany({
    where: { userId },
    orderBy: { appliedAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          type: true,
          startup: { select: { name: true, code: true, logoUrl: true } },
        },
      },
      offer: { select: { id: true, offerNo: true, status: true, joiningDate: true, expiresAt: true } },
    },
  });
}

/** Startup name, logo and role title for co-branding an outbound email. */
async function startupContext(startupId: string, jobId: string) {
  const [startup, job] = await Promise.all([
    prisma.startup.findUnique({ where: { id: startupId }, select: { name: true, logoUrl: true } }),
    prisma.job.findUnique({ where: { id: jobId }, select: { title: true } }),
  ]);
  return {
    startupName: startup?.name ?? "the company",
    logoUrl: startup?.logoUrl ?? null,
    jobTitle: job?.title ?? "the role",
  };
}

function humanise(stage: string) {
  return stage.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
