import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

/**
 * Append-only. There is deliberately no update or delete path — employment and
 * offer events are legal records and must survive.
 */
export async function audit(
  args: {
    action: string;
    entity: string;
    entityId?: string;
    actorId?: string;
    startupId?: string;
    metadata?: Record<string, unknown>;
  },
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;
  await client.auditLog.create({
    data: {
      action: args.action,
      entity: args.entity,
      entityId: args.entityId,
      adminId: args.actorId,
      metadata: {
        ...(args.metadata ?? {}),
        ...(args.startupId ? { startupId: args.startupId } : {}),
      } as Prisma.InputJsonValue,
    },
  });
}

export const AuditAction = {
  JOB_CREATED: "job.created",
  JOB_UPDATED: "job.updated",
  JOB_PUBLISHED: "job.published",
  JOB_CLOSED: "job.closed",
  APPLICATION_SUBMITTED: "application.submitted",
  APPLICATION_TRANSITIONED: "application.transitioned",
  APPLICATION_REJECTED: "application.rejected",
  APPLICATION_WITHDRAWN: "application.withdrawn",
  INTERVIEW_SCHEDULED: "interview.scheduled",
  INTERVIEW_UPDATED: "interview.updated",
  FEEDBACK_SUBMITTED: "interview.feedback_submitted",
  OFFER_GENERATED: "offer.generated",
  OFFER_SENT: "offer.sent",
  OFFER_ACCEPTED: "offer.accepted",
  OFFER_DECLINED: "offer.declined",
  OFFER_REVOKED: "offer.revoked",
  CANDIDATE_ONBOARDED: "candidate.onboarded",
  DOCUMENT_ISSUED: "document.issued",
  DOCUMENT_REVOKED: "document.revoked",
  BRANDING_UPDATED: "branding.updated",
  MEMBER_ROLE_CHANGED: "member.role_changed",
} as const;
