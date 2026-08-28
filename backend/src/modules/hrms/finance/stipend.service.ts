import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { audit } from "../../shared/audit.service";
import { policyFor } from "../attendance/intern.service";
import { slotPolicyFor } from "../attendance/worklog.service";
import * as R from "../attendance/rules";

/**
 * Stipend arithmetic.
 *
 * Money is held as whole rupees in integers throughout. Fractions of a day are
 * carried as "centidays" (100 = a full day, 50 = a half) so a half day never
 * needs a float — 0.1 + 0.2 problems in payroll surface as a rupee that does
 * not reconcile, months later, with no way to tell which run was wrong.
 */

/**
 * Reads the free-text stipend field as a number.
 *
 * Live data contains "10000", "Rs 20,000/month" and — genuinely — "Remote".
 * Anything without digits returns null so the caller can refuse to pay rather
 * than quietly treating an unparseable stipend as zero.
 */
export function parseStipend(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d.]/g, "");
  if (!digits) return null;
  const n = Math.round(Number(digits));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** The monthly figure to compute against, preferring the numeric column. */
export function stipendOf(intern: { stipendAmount: number | null; stipend: string | null }) {
  return intern.stipendAmount ?? parseStipend(intern.stipend);
}

export interface Computed {
  internId: string;
  internCode: string;
  fullName: string;
  stipendAmount: number | null;
  workingDays: number;
  presentDays: number;
  lateDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  paidLeaveDays: number;
  payableCentidays: number;
  slotsRequired: number;
  slotsFiled: number;
  incompleteDays: number;
  /** Days worked but downgraded because the updates were not filed. */
  unaccountedDays: number;
  compliancePercent: number;
  perDayRate: number;
  grossAmount: number;
  /** Set when the figure cannot be trusted — never silently zero. */
  problem: string | null;
}

/**
 * Works out one intern's month from their attendance.
 *
 * Pure with respect to the payout table: it never reads or writes a saved
 * payout, so it can be called freely to preview a month in progress. Freezing
 * happens only in `approve`.
 */
export async function computeFor(args: {
  startupId: string;
  internId: string;
  year: number;
  month: number;
}): Promise<Computed> {
  const intern = await prisma.intern.findFirst({
    where: { id: args.internId, startupId: args.startupId },
  });
  if (!intern) throw new AppError(404, "Intern not found", "NOT_FOUND");

  const policy = await policyFor(args.startupId);
  const days = R.workingDaysIn({
    policy,
    year: args.year,
    month: args.month,
    from: intern.startDate,
    to: intern.endDate,
  });

  const records = days.length
    ? await prisma.attendance.findMany({
        where: { internId: intern.id, date: { gte: days[0], lte: days[days.length - 1] } },
        include: { workLogs: true, daySummary: { select: { id: true } } },
      })
    : [];
  const byDate = new Map(records.map((r) => [r.date.getTime(), r]));
  const today = R.dayOf(new Date());

  const slotPolicy = await slotPolicyFor(args.startupId);
  let slotsRequired = 0, slotsFiled = 0, incompleteDays = 0, unaccountedDays = 0;
  let presentDays = 0, lateDays = 0, halfDays = 0, absentDays = 0, leaveDays = 0;
  let paidLeaveDays = 0, payableCentidays = 0, countedDays = 0;
  let paidLeaveRemaining = policy.paidLeavesPerMonth;

  for (const d of days) {
    // A day that has not happened yet is not an absence and is not payable.
    if (d.getTime() > today.getTime()) continue;
    countedDays++;

    const rec = byDate.get(d.getTime());
    // Settle a forgotten check-out exactly as the month view shows it —
    // otherwise the dashboard says half day and the payout pays nothing.
    const clockStatus = (
      rec?.status === "OPEN" && rec.checkIn
        ? R.gradeUnclosedDay({ policy, mode: rec.mode as R.AttendanceMode, date: d, checkIn: rec.checkIn }).status
        : rec?.status ?? "ABSENT"
    ) as R.AttendanceStatus;

    /**
     * The clock sets the ceiling; the updates decide the day. Worked out before
     * the register is counted so a day nobody accounted for is never tallied as
     * present — the payout and the attendance record have to tell the same story.
     */
    const slots = rec?.checkIn
      ? R.slotsForDay({
          policy: slotPolicy,
          date: d,
          mode: (rec.mode as R.AttendanceMode) ?? "OFFICE",
          checkIn: rec.checkIn,
          checkOut: rec.checkOut,
        })
      : [];
    const filed = (rec?.workLogs ?? []).filter((l: { kind: string }) =>
      R.countsTowardCompliance(l.kind as R.WorkKind)
    ).length;
    const accounted = R.applyAccountability({
      policy: slotPolicy,
      status: clockStatus,
      requiredSlots: slots.length,
      filedSlots: filed,
    });
    const status = accounted.status;
    if (accounted.downgraded) unaccountedDays++;

    switch (status) {
      case "PRESENT": presentDays++; break;
      case "LATE": lateDays++; break;
      case "HALF_DAY": halfDays++; break;
      case "LEAVE":
        leaveDays++;
        if (paidLeaveRemaining > 0) paidLeaveDays++;
        break;
      default: absentDays++;
    }

    /**
     * Presence sets the ceiling; accounting for the time sets what is actually
     * earned. A day spent checked in without filing any update is time nobody
     * can vouch for, so it is paid pro-rata to what was reported — and a day
     * with no end-of-day summary is capped separately.
     *
     * Leave and holidays are untouched: there is nothing to report on a day
     * you were not working.
     */
    const base = R.centidaysFor(status, paidLeaveRemaining);
    let dayCentidays = base;

    if (rec?.checkIn && status !== "LEAVE" && status !== "HOLIDAY") {
      const work = R.dayWorkFactor({
        policy: slotPolicy,
        requiredSlots: slots.length,
        filedSlots: filed,
        hasSummary: Boolean(rec.daySummary),
      });

      dayCentidays = Math.round(base * work.factor);
      slotsRequired += slots.length;
      slotsFiled += filed;
      if (work.incomplete && slots.length > 0) incompleteDays++;
    }

    payableCentidays += dayCentidays;
    if (status === "LEAVE" && paidLeaveRemaining > 0) paidLeaveRemaining--;
  }

  const stipendAmount = stipendOf(intern);
  let problem: string | null = null;
  if (stipendAmount === null) {
    problem = `Stipend is not a number (currently "${intern.stipend ?? ""}") — set it before paying`;
  } else if (days.length === 0) {
    problem = "No working days in this month for this intern";
  }

  // Divide by the month's actual working days, so full attendance always pays
  // exactly the agreed stipend regardless of how long the month is.
  const perDayRate = stipendAmount && days.length ? stipendAmount / days.length : 0;
  const grossAmount = Math.round((perDayRate * payableCentidays) / 100);

  return {
    internId: intern.id,
    internCode: intern.internCode,
    fullName: intern.fullName,
    stipendAmount,
    workingDays: days.length,
    presentDays, lateDays, halfDays, absentDays, leaveDays, paidLeaveDays,
    payableCentidays,
    slotsRequired,
    slotsFiled,
    incompleteDays,
    unaccountedDays,
    compliancePercent: slotsRequired === 0 ? 100 : Math.round((slotsFiled / slotsRequired) * 100),
    perDayRate: Math.round(perDayRate * 100) / 100,
    grossAmount: problem ? 0 : grossAmount,
    problem,
  };
}

/**
 * The whole month for a startup: what is owed, to whom.
 *
 * Saved payouts win over a fresh computation — once a month is approved its
 * numbers are history, and recomputing would let a late attendance correction
 * silently change an amount somebody has already been paid.
 */
export async function monthSheet(args: { startupId: string; year: number; month: number }) {
  const interns = await prisma.intern.findMany({
    where: { startupId: args.startupId },
    select: { id: true, startDate: true, endDate: true },
  });

  const first = new Date(Date.UTC(args.year, args.month - 1, 1));
  const last = new Date(Date.UTC(args.year, args.month, 0));
  // Anyone whose engagement overlaps this month, including people who have left.
  const relevant = interns.filter((i) => i.startDate <= last && i.endDate >= first);

  const saved = await prisma.stipendPayout.findMany({
    where: { startupId: args.startupId, periodYear: args.year, periodMonth: args.month },
  });
  const bySaved = new Map(saved.map((s) => [s.internId, s]));

  const rows = await Promise.all(
    relevant.map(async (i) => {
      const frozen = bySaved.get(i.id);
      const computed = await computeFor({ startupId: args.startupId, internId: i.id, year: args.year, month: args.month });

      if (frozen && frozen.status !== "DRAFT") {
        return {
          ...computed,
          workingDays: frozen.workingDays,
          presentDays: frozen.presentDays,
          lateDays: frozen.lateDays,
          halfDays: frozen.halfDays,
          absentDays: frozen.absentDays,
          leaveDays: frozen.leaveDays,
          payableCentidays: frozen.payableCentidays,
          grossAmount: frozen.grossAmount,
          adjustment: frozen.adjustment,
          netAmount: frozen.netAmount,
          status: frozen.status,
          payoutId: frozen.id,
          paidAt: frozen.paidAt,
          paymentRef: frozen.paymentRef,
          problem: null,
        };
      }

      return {
        ...computed,
        adjustment: frozen?.adjustment ?? 0,
        netAmount: computed.grossAmount + (frozen?.adjustment ?? 0),
        status: frozen?.status ?? "DRAFT",
        payoutId: frozen?.id ?? null,
        paidAt: null,
        paymentRef: null,
      };
    })
  );

  rows.sort((a, b) => a.fullName.localeCompare(b.fullName));

  const payable = rows.filter((r) => !r.problem);
  return {
    year: args.year,
    month: args.month,
    rows,
    totals: {
      interns: rows.length,
      totalGross: payable.reduce((s, r) => s + r.grossAmount, 0),
      totalNet: payable.reduce((s, r) => s + r.netAmount, 0),
      needsAttention: rows.filter((r) => r.problem).length,
      paid: rows.filter((r) => r.status === "PAID").length,
      approved: rows.filter((r) => r.status === "APPROVED").length,
    },
  };
}

/** Freeze a month's numbers. After this, attendance edits no longer move it. */
export async function approve(args: {
  startupId: string;
  internId: string;
  year: number;
  month: number;
  adjustment?: number;
  adjustmentNote?: string;
  actorId: string;
}) {
  const c = await computeFor(args);
  if (c.problem) throw new AppError(400, c.problem, "CANNOT_COMPUTE");

  const existing = await prisma.stipendPayout.findUnique({
    where: {
      internId_periodYear_periodMonth: {
        internId: args.internId, periodYear: args.year, periodMonth: args.month,
      },
    },
  });
  if (existing && existing.status === "PAID") {
    throw new AppError(409, "This month has already been paid", "ALREADY_PAID");
  }

  const adjustment = args.adjustment ?? 0;
  const netAmount = c.grossAmount + adjustment;
  if (netAmount < 0) throw new AppError(400, "Adjustment cannot make the payout negative", "NEGATIVE_PAYOUT");

  const data = {
    startupId: args.startupId,
    internId: args.internId,
    periodYear: args.year,
    periodMonth: args.month,
    stipendAmount: c.stipendAmount!,
    workingDays: c.workingDays,
    presentDays: c.presentDays,
    lateDays: c.lateDays,
    halfDays: c.halfDays,
    absentDays: c.absentDays,
    leaveDays: c.leaveDays,
    paidLeaveDays: c.paidLeaveDays,
    payableCentidays: c.payableCentidays,
    grossAmount: c.grossAmount,
    adjustment,
    adjustmentNote: args.adjustmentNote,
    netAmount,
    status: "APPROVED",
    approvedBy: args.actorId,
    approvedAt: new Date(),
  };

  const payout = existing
    ? await prisma.stipendPayout.update({ where: { id: existing.id }, data })
    : await prisma.stipendPayout.create({ data });

  await audit({
    action: "stipend.approved",
    entity: "StipendPayout",
    entityId: payout.id,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { internId: args.internId, period: `${args.year}-${args.month}`, netAmount },
  });

  return payout;
}

export async function markPaid(args: {
  startupId: string;
  payoutId: string;
  paymentRef?: string;
  actorId: string;
}) {
  const payout = await prisma.stipendPayout.findFirst({
    where: { id: args.payoutId, startupId: args.startupId },
  });
  if (!payout) throw new AppError(404, "Payout not found", "NOT_FOUND");
  if (payout.status === "DRAFT") {
    throw new AppError(409, "Approve this payout before marking it paid", "NOT_APPROVED");
  }
  if (payout.status === "PAID") throw new AppError(409, "Already marked paid", "ALREADY_PAID");

  const updated = await prisma.stipendPayout.update({
    where: { id: payout.id },
    data: { status: "PAID", paidAt: new Date(), paymentRef: args.paymentRef },
  });

  await audit({
    action: "stipend.paid",
    entity: "StipendPayout",
    entityId: payout.id,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { internId: payout.internId, amount: payout.netAmount, ref: args.paymentRef },
  });

  return updated;
}

/** Approve everything computable in one go. Problems are reported, not skipped silently. */
export async function approveMonth(args: {
  startupId: string;
  year: number;
  month: number;
  actorId: string;
}) {
  const sheet = await monthSheet(args);
  const approved: string[] = [];
  const skipped: Array<{ fullName: string; reason: string }> = [];

  for (const row of sheet.rows) {
    if (row.problem) { skipped.push({ fullName: row.fullName, reason: row.problem }); continue; }
    if (row.status !== "DRAFT") { skipped.push({ fullName: row.fullName, reason: `already ${row.status.toLowerCase()}` }); continue; }
    await approve({ ...args, internId: row.internId });
    approved.push(row.fullName);
  }

  return { approved: approved.length, skipped, names: approved };
}

/** Set the numeric stipend — the fix for records holding free text. */
export async function setStipendAmount(args: {
  startupId: string;
  internId: string;
  amount: number;
  actorId: string;
}) {
  if (!Number.isInteger(args.amount) || args.amount < 0) {
    throw new AppError(400, "Stipend must be a whole number of rupees", "INVALID_AMOUNT");
  }
  const intern = await prisma.intern.findFirst({ where: { id: args.internId, startupId: args.startupId } });
  if (!intern) throw new AppError(404, "Intern not found", "NOT_FOUND");

  const updated = await prisma.intern.update({
    where: { id: args.internId },
    data: {
      stipendAmount: args.amount,
      // Keep the printable string in step so documents and payroll agree.
      stipend: `Rs ${args.amount.toLocaleString("en-IN")}`,
    },
  });

  await audit({
    action: "stipend.amount_set",
    entity: "Intern",
    entityId: args.internId,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { amount: args.amount },
  });

  return updated;
}
