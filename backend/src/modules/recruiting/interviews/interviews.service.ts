import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { audit, AuditAction } from "../../shared/audit.service";
import { notify } from "../../shared/notification.service";
import { Emails } from "../../../lib/email/templates";

export interface ScheduleInput {
  startupId: string;
  applicationId: string;
  stage: any;
  scheduledAt: Date | string;
  durationMins?: number;
  timezone?: string;
  mode?: string;
  meetingUrl?: string;
  location?: string;
  panelUserIds?: string[];
  actorId: string;
  startupCode: string | null;
}

export async function schedule(input: ScheduleInput) {
  // Callers may hand us an ISO string rather than a Date.
  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new AppError(400, "Invalid interview date", "INVALID_SCHEDULE");
  }

  const app = await prisma.jobApplication.findFirst({
    where: { id: input.applicationId, startupId: input.startupId },
    include: { job: { select: { title: true } }, user: { select: { id: true, email: true } } },
  });
  if (!app) throw new AppError(404, "Application not found", "NOT_FOUND");
  if (app.outcome) throw new AppError(409, "This application is closed", "APPLICATION_CLOSED");
  if (scheduledAt <= new Date()) {
    throw new AppError(400, "Interview must be scheduled in the future", "INVALID_SCHEDULE");
  }

  // Panelists must belong to this tenant — otherwise scheduling would leak the
  // candidate's details to an outsider.
  if (input.panelUserIds?.length) {
    const members = await prisma.startupMember.findMany({
      where: {
        startupId: input.startupId,
        status: "ACTIVE",
        userId: { in: input.panelUserIds },
      },
      select: { userId: true },
    });
    if (members.length !== input.panelUserIds.length) {
      throw new AppError(400, "All panelists must be members of this startup", "INVALID_PANEL");
    }
  }

  const startup = await prisma.startup.findUnique({
    where: { id: input.startupId },
    select: { name: true, logoUrl: true },
  });

  const interview = await prisma.$transaction(async (tx) => {
    const created = await tx.interview.create({
      data: {
        startupId: input.startupId,
        applicationId: input.applicationId,
        stage: input.stage,
        scheduledAt,
        durationMins: input.durationMins ?? 45,
        timezone: input.timezone ?? "Asia/Kolkata",
        mode: input.mode ?? "ONLINE",
        meetingUrl: input.meetingUrl,
        location: input.location,
        createdBy: input.actorId,
        panel: input.panelUserIds?.length
          ? { create: input.panelUserIds.map((userId) => ({ userId })) }
          : undefined,
      },
      include: { panel: true },
    });

    await audit(
      {
        action: AuditAction.INTERVIEW_SCHEDULED,
        entity: "Interview",
        entityId: created.id,
        actorId: input.actorId,
        startupId: input.startupId,
        metadata: { applicationId: input.applicationId, scheduledAt },
      },
      tx
    );

    return created;
  });

  await notify({
    userId: app.userId,
    event: "INTERVIEW_SCHEDULED",
    title: `Interview scheduled — ${app.job.title}`,
    message: `Your ${String(input.stage).replace(/_/g, " ").toLowerCase()} is scheduled for ${scheduledAt.toUTCString()} (${input.timezone ?? "Asia/Kolkata"}).`,
    link: `/dashboard/applications/${input.applicationId}`,
    html: Emails.interviewScheduled({
      name: app.applicantName ?? "there",
      jobTitle: app.job.title,
      startupName: startup?.name ?? "the company",
      round: String(input.stage).replace(/_/g, " "),
      when: scheduledAt.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" }),
      mode: input.mode ?? "ONLINE",
      meetingUrl: input.meetingUrl,
      logoUrl: startup?.logoUrl,
    }),
  });

  for (const p of interview.panel) {
    await notify({
      userId: p.userId,
      event: "INTERVIEW_SCHEDULED",
      title: "You are on an interview panel",
      message: `Interview for ${app.job.title} on ${scheduledAt.toUTCString()}.`,
      link: `/s/${input.startupCode}/interviews/${interview.id}`,
    });
  }

  return interview;
}

export async function update(
  db: any,
  id: string,
  startupId: string,
  actorId: string,
  data: Record<string, unknown>
) {
  const existing = await db.interview.findFirst({ where: { id } });
  if (!existing) throw new AppError(404, "Interview not found", "NOT_FOUND");

  const updated = await db.interview.update({ where: { id }, data });

  await audit({
    action: AuditAction.INTERVIEW_UPDATED,
    entity: "Interview",
    entityId: id,
    actorId,
    startupId,
    metadata: data,
  });

  return updated;
}

export async function submitFeedback(args: {
  db: any;
  startupId: string;
  interviewId: string;
  reviewerId: string;
  rating: number;
  recommend: any;
  strengths?: string;
  concerns?: string;
  notes?: string;
}) {
  const interview = await args.db.interview.findFirst({ where: { id: args.interviewId } });
  if (!interview) throw new AppError(404, "Interview not found", "NOT_FOUND");

  // One feedback per reviewer per interview — upsert so an edit replaces rather
  // than duplicates, while the unique constraint guards concurrent submits.
  const feedback = await prisma.interviewFeedback.upsert({
    where: {
      interviewId_reviewerId: { interviewId: args.interviewId, reviewerId: args.reviewerId },
    },
    create: {
      startupId: args.startupId,
      interviewId: args.interviewId,
      reviewerId: args.reviewerId,
      rating: args.rating,
      recommend: args.recommend,
      strengths: args.strengths,
      concerns: args.concerns,
      notes: args.notes,
    },
    update: {
      rating: args.rating,
      recommend: args.recommend,
      strengths: args.strengths,
      concerns: args.concerns,
      notes: args.notes,
    },
  });

  await prisma.interview.update({
    where: { id: args.interviewId },
    data: { status: "COMPLETED" },
  });

  await audit({
    action: AuditAction.FEEDBACK_SUBMITTED,
    entity: "InterviewFeedback",
    entityId: feedback.id,
    actorId: args.reviewerId,
    startupId: args.startupId,
    metadata: { rating: args.rating, recommend: args.recommend },
  });

  return feedback;
}

export async function listUpcoming(db: any) {
  return db.interview.findMany({
    where: { scheduledAt: { gte: new Date() }, status: "SCHEDULED" },
    orderBy: { scheduledAt: "asc" },
    include: {
      application: {
        select: { id: true, applicationNo: true, applicantName: true, job: { select: { title: true } } },
      },
      panel: true,
      feedback: true,
    },
  });
}
