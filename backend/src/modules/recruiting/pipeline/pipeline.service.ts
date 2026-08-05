import { PipelineStage, Outcome, Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { rank, TenantRole } from "../../../middleware/tenant";

/** Canonical order. A job may skip stages, but never reorder them. */
export const DEFAULT_PIPELINE: PipelineStage[] = [
  "APPLIED",
  "RESUME_SCREENING",
  "SHORTLISTED",
  "HR_ROUND",
  "TECHNICAL_ROUND",
  "ASSIGNMENT",
  "FINAL_INTERVIEW",
  "SELECTED",
  "OFFER_GENERATED",
  "OFFER_ACCEPTED",
  "ONBOARDING",
  "ONBOARDED",
];

/** Stages a job may omit. The rest are mandatory checkpoints. */
export const SKIPPABLE: PipelineStage[] = ["TECHNICAL_ROUND", "ASSIGNMENT", "HR_ROUND"];

/** Reached only through their dedicated services, never a plain transition. */
const SERVICE_OWNED: PipelineStage[] = ["OFFER_GENERATED", "OFFER_ACCEPTED", "ONBOARDED"];

const TERMINAL_OUTCOMES: Outcome[] = [
  "REJECTED",
  "WITHDRAWN",
  "OFFER_DECLINED",
  "OFFER_REVOKED",
  "NO_SHOW",
  "HIRED",
];

export function pipelineFor(template: PipelineStage[]): PipelineStage[] {
  if (!template || template.length === 0) return DEFAULT_PIPELINE;
  // Always honour canonical ordering regardless of how the template was stored.
  return DEFAULT_PIPELINE.filter((s) => template.includes(s));
}

export interface TransitionInput {
  applicationId: string;
  toStage: PipelineStage;
  version: number;
  note?: string;
  actorId: string;
  tenantRole: TenantRole;
  startupId: string;
}

/**
 * The single writer of JobApplication.stage.
 *
 * Every call appends an ApplicationStageEvent — the event log is the source of
 * truth and is never updated or deleted. `stage` on the application is a cache
 * of the latest event, kept for query speed.
 */
export async function transition(input: TransitionInput) {
  const { applicationId, toStage, version, note, actorId, tenantRole, startupId } = input;

  return prisma.$transaction(async (tx) => {
    const app = await tx.jobApplication.findFirst({
      where: { id: applicationId, startupId },
      include: { job: { select: { pipelineTemplate: true, title: true } } },
    });
    if (!app) throw new AppError(404, "Application not found", "NOT_FOUND");

    if (app.outcome && TERMINAL_OUTCOMES.includes(app.outcome)) {
      throw new AppError(409, `Application is closed (${app.outcome})`, "APPLICATION_CLOSED");
    }

    if (SERVICE_OWNED.includes(toStage)) {
      throw new AppError(
        400,
        `${toStage} is set by its own workflow, not a manual transition`,
        "STAGE_NOT_MANUAL"
      );
    }

    const stages = pipelineFor(app.job.pipelineTemplate);
    const fromIdx = stages.indexOf(app.stage);
    const toIdx = stages.indexOf(toStage);

    if (toIdx === -1) {
      throw new AppError(400, `${toStage} is not part of this job's pipeline`, "STAGE_NOT_IN_PIPELINE");
    }
    if (toIdx === fromIdx) {
      throw new AppError(409, "Application is already at this stage", "NO_OP_TRANSITION");
    }

    // Moving backwards is allowed (a panel may want another round) but is
    // restricted, because it can undo a rejection decision.
    if (toIdx < fromIdx && rank(tenantRole) > rank("HR")) {
      throw new AppError(403, "Only HR and above can move a candidate backwards", "FORBIDDEN");
    }

    // Forward jumps may only skip stages that are declared skippable.
    if (toIdx > fromIdx + 1) {
      const skipped = stages.slice(fromIdx + 1, toIdx);
      const illegal = skipped.filter((s) => !SKIPPABLE.includes(s));
      if (illegal.length) {
        throw new AppError(
          400,
          `Cannot skip ${illegal.join(", ")} — advance one stage at a time`,
          "ILLEGAL_SKIP"
        );
      }
    }

    const updated = await tx.jobApplication.updateMany({
      where: { id: applicationId, version },
      data: { stage: toStage, version: { increment: 1 } },
    });

    // Zero rows means another recruiter moved this candidate first.
    if (updated.count === 0) {
      throw new AppError(
        409,
        "This application was updated by someone else. Refresh and try again.",
        "STALE_VERSION"
      );
    }

    await tx.applicationStageEvent.create({
      data: {
        startupId,
        applicationId,
        fromStage: app.stage,
        toStage,
        note,
        actorId,
      },
    });

    return tx.jobApplication.findUnique({ where: { id: applicationId } });
  });
}

export interface CloseInput {
  applicationId: string;
  outcome: Extract<Outcome, "REJECTED" | "WITHDRAWN" | "NO_SHOW">;
  reason?: string;
  version: number;
  actorId: string;
  startupId: string;
}

/** Terminal close. The application row is kept forever; nothing is deleted. */
export async function close(input: CloseInput) {
  const { applicationId, outcome, reason, version, actorId, startupId } = input;

  return prisma.$transaction(async (tx) => {
    const app = await tx.jobApplication.findFirst({ where: { id: applicationId, startupId } });
    if (!app) throw new AppError(404, "Application not found", "NOT_FOUND");
    if (app.outcome) {
      throw new AppError(409, `Application already closed (${app.outcome})`, "APPLICATION_CLOSED");
    }

    const updated = await tx.jobApplication.updateMany({
      where: { id: applicationId, version },
      data: {
        outcome,
        status: outcome === "REJECTED" ? "REJECTED" : app.status,
        rejectionReason: reason ?? null,
        withdrawnAt: outcome === "WITHDRAWN" ? new Date() : null,
        version: { increment: 1 },
      },
    });
    if (updated.count === 0) {
      throw new AppError(409, "This application was updated by someone else.", "STALE_VERSION");
    }

    await tx.applicationStageEvent.create({
      data: {
        startupId,
        applicationId,
        fromStage: app.stage,
        toStage: app.stage,
        outcome,
        note: reason,
        actorId,
      },
    });

    return tx.jobApplication.findUnique({ where: { id: applicationId } });
  });
}

/** Used by offer/onboarding services, which own their own stage writes. */
export async function recordServiceStage(
  tx: Prisma.TransactionClient,
  args: {
    startupId: string;
    applicationId: string;
    fromStage: PipelineStage;
    toStage: PipelineStage;
    outcome?: Outcome;
    note?: string;
    actorId?: string;
  }
) {
  await tx.jobApplication.update({
    where: { id: args.applicationId },
    data: {
      stage: args.toStage,
      outcome: args.outcome,
      version: { increment: 1 },
    },
  });
  await tx.applicationStageEvent.create({ data: args });
}
