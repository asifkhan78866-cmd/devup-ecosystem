import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { audit } from "../../shared/audit.service";
import { notify } from "../../shared/notification.service";

export const REVIEW_STATUS = ["DRAFT", "SUBMITTED", "ACKNOWLEDGED"] as const;

export async function create(args: {
  db: any;
  startupId: string;
  employeeId: string;
  periodStart: string | Date;
  periodEnd: string | Date;
  rating: number;
  strengths?: string;
  improvements?: string;
  goals?: string;
  reviewerId: string;
  submit?: boolean;
}) {
  const employee = await args.db.employee.findFirst({ where: { id: args.employeeId } });
  if (!employee) throw new AppError(404, "Employee not found", "NOT_FOUND");

  const start = new Date(args.periodStart);
  const end = new Date(args.periodEnd);
  if (end <= start) throw new AppError(400, "Review period end must be after start", "INVALID_PERIOD");
  if (start < new Date(employee.joinedAt)) {
    throw new AppError(400, "Review period starts before the employee joined", "INVALID_PERIOD");
  }

  const review = await args.db.performanceReview.create({
    data: {
      employeeId: args.employeeId,
      periodStart: start,
      periodEnd: end,
      reviewerId: args.reviewerId,
      rating: args.rating,
      strengths: args.strengths,
      improvements: args.improvements,
      goals: args.goals,
      status: args.submit ? "SUBMITTED" : "DRAFT",
    },
  });

  await audit({
    action: "performance.review_created",
    entity: "PerformanceReview",
    entityId: review.id,
    actorId: args.reviewerId,
    startupId: args.startupId,
    metadata: { employeeId: args.employeeId, rating: args.rating, status: review.status },
  });

  // The employee is only told once the review is actually submitted — a draft
  // is the reviewer's working copy and should stay private.
  if (args.submit && employee.userId) {
    await notify({
      userId: employee.userId,
      event: "STAGE_CHANGED",
      title: "Your performance review is ready",
      message: `A review covering ${start.toDateString()} to ${end.toDateString()} has been shared with you.`,
      link: "/dashboard",
    });
  }

  return review;
}

export async function update(args: {
  db: any;
  startupId: string;
  id: string;
  actorId: string;
  data: Record<string, unknown>;
}) {
  const existing = await args.db.performanceReview.findFirst({ where: { id: args.id } });
  if (!existing) throw new AppError(404, "Review not found", "NOT_FOUND");
  if (existing.status === "ACKNOWLEDGED") {
    throw new AppError(409, "An acknowledged review can no longer be edited", "REVIEW_LOCKED");
  }

  const updated = await args.db.performanceReview.update({ where: { id: args.id }, data: args.data });

  await audit({
    action: "performance.review_updated",
    entity: "PerformanceReview",
    entityId: args.id,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: args.data,
  });

  return updated;
}

export async function list(db: any, employeeId?: string) {
  return db.performanceReview.findMany({
    where: employeeId ? { employeeId } : {},
    orderBy: { periodEnd: "desc" },
    include: {
      employee: { select: { id: true, fullName: true, employeeCode: true, designation: true } },
    },
  });
}

/** An employee acknowledging their own review locks it from further edits. */
export async function acknowledge(startupId: string, id: string, userId: string) {
  const review = await prisma.performanceReview.findFirst({
    where: { id, startupId },
    include: { employee: { select: { userId: true } } },
  });
  if (!review) throw new AppError(404, "Review not found", "NOT_FOUND");
  if (review.employee.userId !== userId) {
    throw new AppError(403, "You can only acknowledge your own review", "FORBIDDEN");
  }
  if (review.status !== "SUBMITTED") {
    throw new AppError(409, "Only a submitted review can be acknowledged", "INVALID_STATE");
  }

  return prisma.performanceReview.update({ where: { id }, data: { status: "ACKNOWLEDGED" } });
}

/** Rating distribution + averages for the workspace dashboard. */
export async function summary(db: any) {
  const reviews = await db.performanceReview.findMany({
    where: { status: { in: ["SUBMITTED", "ACKNOWLEDGED"] } },
    select: { rating: true, employeeId: true },
  });

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;

  return {
    total: reviews.length,
    reviewed: new Set(reviews.map((r: any) => r.employeeId)).size,
    average: reviews.length
      ? Number((reviews.reduce((a: number, r: any) => a + r.rating, 0) / reviews.length).toFixed(2))
      : 0,
    distribution,
  };
}
