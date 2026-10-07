import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { audit, AuditAction } from "../../shared/audit.service";

/**
 * Columns HR may write on a job. The tenant-scoped client pins `startupId` on
 * create, but on update it would pass `startupId` through — moving the job to
 * another startup — and it never inspects nested relation writes, so
 * `applications: { connect: [{ id }] }` could pull another startup's
 * candidates onto this job. Only these keys are written.
 */
const JOB_FIELDS = [
  "title", "description", "type", "domain", "skills", "location", "isRemote", "stipend",
  "salaryRange", "openings", "deadline", "department", "workMode", "responsibilities",
  "requiredSkills", "preferredSkills", "durationMonths", "status", "pipelineTemplate", "hiringManagerId",
] as const;

function jobFields(data: Record<string, unknown> | undefined) {
  const out: Record<string, unknown> = {};
  for (const key of JOB_FIELDS) {
    if (data && Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) out[key] = data[key];
  }
  return out;
}

export async function list(db: any, status?: string) {
  return db.job.findMany({
    where: status ? { status: status as never } : {},
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { applications: true } },
      hiringManager: { select: { id: true, email: true } },
    },
  });
}

export async function getOne(db: any, id: string) {
  const job = await db.job.findFirst({
    where: { id },
    include: { _count: { select: { applications: true } } },
  });
  if (!job) throw new AppError(404, "Job not found", "NOT_FOUND");
  return job;
}

export async function create(db: any, startupId: string, actorId: string, data: any) {
  data = jobFields(data);
  // isActive mirrors status for backward compatibility with the public job list.
  const job = await db.job.create({
    data: { ...data, status: data.status ?? "DRAFT", isActive: data.status === "OPEN" },
  });

  await audit({
    action: AuditAction.JOB_CREATED,
    entity: "Job",
    entityId: job.id,
    actorId,
    startupId,
    metadata: { title: job.title },
  });

  return job;
}

export async function update(db: any, startupId: string, id: string, actorId: string, data: any) {
  data = jobFields(data);
  await getOne(db, id);
  const job = await db.job.update({
    where: { id },
    data: { ...data, ...(data.status ? { isActive: data.status === "OPEN" } : {}) },
  });

  await audit({
    action: AuditAction.JOB_UPDATED,
    entity: "Job",
    entityId: id,
    actorId,
    startupId,
    metadata: data,
  });

  return job;
}

export async function publish(db: any, startupId: string, id: string, actorId: string) {
  const job = await getOne(db, id);
  if (job.status === "OPEN") return job;

  const updated = await db.job.update({
    where: { id },
    data: { status: "OPEN", isActive: true, publishedAt: job.publishedAt ?? new Date() },
  });

  await audit({
    action: AuditAction.JOB_PUBLISHED,
    entity: "Job",
    entityId: id,
    actorId,
    startupId,
  });

  return updated;
}

/**
 * Closing a job with candidates mid-pipeline is blocked unless forced, because
 * it silently strands people who are waiting on a decision.
 */
export async function close(
  db: any,
  startupId: string,
  id: string,
  actorId: string,
  opts: { force?: boolean; reason?: string } = {}
) {
  await getOne(db, id);

  const inFlight = await db.jobApplication.count({
    where: { jobId: id, outcome: null, stage: { notIn: ["ONBOARDED"] } },
  });

  if (inFlight > 0 && !opts.force) {
    throw new AppError(
      409,
      `${inFlight} candidate${inFlight === 1 ? " is" : "s are"} still in the pipeline for this role. Close anyway with force=true to reject them.`,
      "CANDIDATES_IN_FLIGHT"
    );
  }

  return prisma.$transaction(async (tx) => {
    if (inFlight > 0 && opts.force) {
      const open = await tx.jobApplication.findMany({
        where: { jobId: id, outcome: null, startupId },
        select: { id: true, stage: true },
      });

      await tx.jobApplication.updateMany({
        where: { id: { in: open.map((a) => a.id) } },
        data: {
          outcome: "REJECTED",
          status: "REJECTED",
          rejectionReason: opts.reason ?? "Role closed",
          version: { increment: 1 },
        },
      });

      // History is per-application and append-only, so write one event each.
      await tx.applicationStageEvent.createMany({
        data: open.map((a) => ({
          startupId,
          applicationId: a.id,
          fromStage: a.stage,
          toStage: a.stage,
          outcome: "REJECTED" as const,
          note: opts.reason ?? "Role closed",
          actorId,
        })),
      });
    }

    const updated = await tx.job.update({
      where: { id },
      data: { status: "CLOSED", isActive: false, closedAt: new Date() },
    });

    await audit(
      {
        action: AuditAction.JOB_CLOSED,
        entity: "Job",
        entityId: id,
        actorId,
        startupId,
        metadata: { rejectedCount: opts.force ? inFlight : 0, reason: opts.reason },
      },
      tx
    );

    return updated;
  });
}
