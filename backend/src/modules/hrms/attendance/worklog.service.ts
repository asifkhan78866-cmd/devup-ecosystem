import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { audit } from "../../shared/audit.service";
import { notifyTenantRoles } from "../../shared/notification.service";
import { policyFor } from "./intern.service";
import * as R from "./rules";

/**
 * Hourly-ish work updates.
 *
 * Attendance proves someone was present. This proves what they did with the
 * time, which is a different claim and the one that actually matters — an
 * intern can hold a check-in open all day and account for none of it.
 *
 * Nothing here is written by a scheduler. A slot that was never filed simply
 * *is* missed, so the state is derived on read; there is no nightly job to fail
 * silently and leave a month ungraded.
 */

export async function slotPolicyFor(startupId: string): Promise<R.SlotPolicy> {
  const row = await prisma.attendancePolicy.findUnique({ where: { startupId } });
  const base = await policyFor(startupId);
  return { ...R.DEFAULT_SLOT_POLICY, ...base, ...(row ?? {}) } as R.SlotPolicy;
}

async function internOrThrow(internId: string, userId?: string) {
  const intern = await prisma.intern.findFirst({
    where: { id: internId, ...(userId ? { userId } : {}) },
  });
  if (!intern) throw new AppError(404, "Intern record not found", "NOT_FOUND");
  return intern;
}


/**
 * Locate the day a slot belongs to.
 *
 * A slot is not always on the same calendar day as its attendance record: a
 * remote session that starts at 22:00 runs its later slots past midnight, and
 * the day is stamped from the check-in. So the candidate days are the slot's
 * own day and the one before it, and the winner is whichever actually
 * generates a slot starting at that instant.
 */
async function findSlot(
  intern: { id: string; startupId: string; officeDays: number[] },
  policy: R.SlotPolicy,
  slotStart: Date
) {
  const candidates = [R.dayOf(slotStart), R.dayOf(new Date(slotStart.getTime() - 864e5))];

  for (const date of candidates) {
    const attendance = await prisma.attendance.findUnique({
      where: { internId_date: { internId: intern.id, date } },
    });
    if (!attendance?.checkIn) continue;

    const slots = R.slotsForDay({
      policy,
      date,
      mode: (attendance.mode as R.AttendanceMode) ?? R.modeFor(intern.officeDays, date),
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
    });
    const slot = slots.find((s) => s.start.getTime() === slotStart.getTime());
    if (slot) return { attendance, slot, date };
  }
  return null;
}

export interface SlotView {
  index: number;
  slotStart: Date;
  slotEnd: Date;
  state: R.SlotState;
  opensAt: Date;
  closesAt: Date;
  log: {
    id: string;
    kind: string;
    summary: string;
    evidenceUrl: string | null;
    submittedAt: Date;
    status: string;
    excuseReason: string | null;
  } | null;
}

/**
 * One day's slots with whatever was filed against them.
 *
 * `state` is computed rather than stored: PENDING before the window opens,
 * OPEN while it is fileable, then whatever was filed — or MISSED once the
 * window has closed on silence.
 */
export async function dayView(args: { internId: string; date: Date | string; userId?: string }) {
  const intern = await internOrThrow(args.internId, args.userId);
  const policy = await slotPolicyFor(intern.startupId);
  const date = R.dayOf(args.date);
  const now = new Date();

  const attendance = await prisma.attendance.findUnique({
    where: { internId_date: { internId: intern.id, date } },
    include: {
      workLogs: { orderBy: { slotStart: "asc" } },
      daySummary: true,
    },
  });

  const working =
    R.isWorkingDay(policy, date) &&
    date >= R.dayOf(intern.startDate) &&
    date <= R.dayOf(intern.endDate);

  const mode = R.modeFor(intern.officeDays, date);

  // No attendance, or a day nobody was expected to work: nothing is owed.
  const slots =
    working && attendance?.checkIn
      ? R.slotsForDay({
          policy,
          date,
          mode: (attendance.mode as R.AttendanceMode) ?? mode,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
        })
      : [];

  const byStart = new Map((attendance?.workLogs ?? []).map((l) => [l.slotStart.getTime(), l]));

  const views: SlotView[] = slots.map((slot) => {
    const log = byStart.get(slot.start.getTime()) ?? null;
    const w = R.slotWindow(policy, slot, now);

    let state: R.SlotState;
    if (log) state = log.status as R.SlotState;
    else if (w.notYet) state = "PENDING";
    else if (w.isOpen) state = "OPEN";
    else state = "MISSED";

    return {
      index: slot.index,
      slotStart: slot.start,
      slotEnd: slot.end,
      state,
      opensAt: w.opensAt,
      closesAt: w.closesAt,
      log: log
        ? {
            id: log.id,
            kind: log.kind,
            summary: log.summary,
            evidenceUrl: log.evidenceUrl,
            submittedAt: log.submittedAt,
            status: log.status,
            excuseReason: log.excuseReason,
          }
        : null,
    };
  });

  // Breaks are not work, so they are neither owed nor counted.
  const required = views.filter(
    (v) => !v.log || R.countsTowardCompliance(v.log.kind as R.WorkKind)
  ).length;
  const filed = views.filter(
    (v) => v.log && R.countsTowardCompliance(v.log.kind as R.WorkKind)
  ).length;

  const work = R.dayWorkFactor({
    policy,
    requiredSlots: required,
    filedSlots: filed,
    hasSummary: Boolean(attendance?.daySummary),
  });

  return {
    date,
    mode: (attendance?.mode as R.AttendanceMode) ?? mode,
    isWorkingDay: working,
    attendance: attendance
      ? {
          id: attendance.id,
          status: attendance.status,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          workedMinutes: attendance.workedMinutes,
        }
      : null,
    slots: views,
    summary: attendance?.daySummary ?? null,
    compliance: {
      required,
      filed,
      missed: views.filter((v) => v.state === "MISSED").length,
      percent: Math.round(work.compliance * 100),
      factor: work.factor,
      incomplete: work.incomplete,
    },
  };
}

/**
 * File the update for one slot.
 *
 * The slot is identified by its start time rather than an index, so a request
 * that was composed before the day rolled over cannot land on the wrong slot.
 */
export async function fileUpdate(args: {
  internId: string;
  userId: string;
  slotStart: Date | string;
  kind: R.WorkKind;
  summary: string;
  evidenceUrl?: string;
}) {
  const intern = await internOrThrow(args.internId, args.userId);
  const policy = await slotPolicyFor(intern.startupId);
  const now = new Date();
  const slotStart = new Date(args.slotStart);

  const found = await findSlot(intern, policy, slotStart);
  if (!found) {
    throw new AppError(
      409,
      "No open working day contains that slot — check in first",
      "NOT_CHECKED_IN"
    );
  }
  const { attendance, slot } = found;

  const w = R.slotWindow(policy, slot, now);
  if (w.notYet) {
    throw new AppError(
      409,
      `This slot can be filed from ${w.opensAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`,
      "SLOT_NOT_OPEN"
    );
  }

  // Filing after the window is allowed but recorded as late — refusing it
  // outright would only guarantee the day is never accounted for at all.
  const status = w.hasPassed ? "LATE" : "ON_TIME";

  const summary = args.summary.trim();
  if (summary.length < 3) {
    throw new AppError(400, "Say what you worked on", "SUMMARY_REQUIRED");
  }

  const record = await prisma.workLog.upsert({
    where: { internId_slotStart: { internId: intern.id, slotStart: slot.start } },
    create: {
      startupId: intern.startupId,
      internId: intern.id,
      attendanceId: attendance.id,
      slotStart: slot.start,
      slotEnd: slot.end,
      kind: args.kind,
      summary,
      evidenceUrl: args.evidenceUrl?.trim() || null,
      submittedAt: now,
      status,
    },
    update: {
      kind: args.kind,
      summary,
      evidenceUrl: args.evidenceUrl?.trim() || null,
      submittedAt: now,
      status,
    },
  });

  // Being stuck is the one thing worth interrupting somebody for.
  if (args.kind === "BLOCKED") {
    await notifyTenantRoles(intern.startupId, ["FOUNDER", "OWNER", "ADMIN"], {
      event: "STAGE_CHANGED",
      channel: "inapp",
      title: `${intern.fullName} is blocked`,
      message: summary,
      link: `/s/${intern.startupId}/interns`,
    });
  }

  await audit({
    action: "worklog.filed",
    entity: "WorkLog",
    entityId: record.id,
    actorId: args.userId,
    startupId: intern.startupId,
    metadata: { internId: intern.id, slot: slot.start.toISOString(), kind: args.kind, status },
  });

  return record;
}

/** The end-of-day conclusion. Required for the day to count as complete. */
export async function fileSummary(args: {
  internId: string;
  userId: string;
  date?: Date | string;
  done: string;
  blocked?: string;
  tomorrow?: string;
}) {
  const intern = await internOrThrow(args.internId, args.userId);
  const date = R.dayOf(args.date ?? new Date());

  const attendance = await prisma.attendance.findUnique({
    where: { internId_date: { internId: intern.id, date } },
  });
  if (!attendance?.checkIn) {
    throw new AppError(409, "Check in before writing a summary", "NOT_CHECKED_IN");
  }

  const done = args.done.trim();
  if (done.length < 10) {
    throw new AppError(400, "Say what you got done today", "SUMMARY_TOO_SHORT");
  }

  const record = await prisma.daySummary.upsert({
    where: { attendanceId: attendance.id },
    create: {
      startupId: intern.startupId,
      internId: intern.id,
      attendanceId: attendance.id,
      done,
      blocked: args.blocked?.trim() || null,
      tomorrow: args.tomorrow?.trim() || null,
    },
    update: {
      done,
      blocked: args.blocked?.trim() || null,
      tomorrow: args.tomorrow?.trim() || null,
      submittedAt: new Date(),
    },
  });

  await audit({
    action: "worklog.summary",
    entity: "DaySummary",
    entityId: record.id,
    actorId: args.userId,
    startupId: intern.startupId,
    metadata: { internId: intern.id, date: date.toISOString().slice(0, 10) },
  });

  return record;
}

/**
 * A month of days for one intern, each with how well it was accounted for.
 * This is what the founder's drill-down renders.
 */
export async function monthView(args: {
  internId: string;
  year: number;
  month: number;
  userId?: string;
}) {
  const intern = await internOrThrow(args.internId, args.userId);
  const policy = await slotPolicyFor(intern.startupId);

  const days = R.workingDaysIn({
    policy,
    year: args.year,
    month: args.month,
    from: intern.startDate,
    to: intern.endDate,
  });
  if (days.length === 0) {
    return { internId: intern.id, fullName: intern.fullName, year: args.year, month: args.month, days: [], totals: null };
  }

  const [records, summaries] = await Promise.all([
    prisma.attendance.findMany({
      where: { internId: intern.id, date: { gte: days[0], lte: days[days.length - 1] } },
      include: { workLogs: true, daySummary: true },
    }),
    Promise.resolve(null),
  ]);
  void summaries;

  const byDate = new Map(records.map((r) => [r.date.getTime(), r]));
  const today = R.dayOf(new Date());

  const rows = days.map((d) => {
    const rec = byDate.get(d.getTime());
    const mode = R.modeFor(intern.officeDays, d);

    if (!rec?.checkIn) {
      return {
        date: d,
        mode,
        status: d.getTime() >= today.getTime() ? "PENDING" : "ABSENT",
        required: 0,
        filed: 0,
        missed: 0,
        percent: 0,
        hasSummary: false,
        incomplete: d.getTime() < today.getTime(),
      };
    }

    const slots = R.slotsForDay({
      policy,
      date: d,
      mode: (rec.mode as R.AttendanceMode) ?? mode,
      checkIn: rec.checkIn,
      checkOut: rec.checkOut,
    });
    const logs = rec.workLogs.filter((l) => R.countsTowardCompliance(l.kind as R.WorkKind));
    const work = R.dayWorkFactor({
      policy,
      requiredSlots: slots.length,
      filedSlots: logs.length,
      hasSummary: Boolean(rec.daySummary),
    });

    return {
      date: d,
      mode: rec.mode,
      status: rec.status,
      required: slots.length,
      filed: logs.length,
      missed: Math.max(0, slots.length - logs.length),
      percent: Math.round(work.compliance * 100),
      hasSummary: Boolean(rec.daySummary),
      incomplete: work.incomplete,
    };
  });

  const counted = rows.filter((r) => r.status !== "PENDING");
  return {
    internId: intern.id,
    fullName: intern.fullName,
    internCode: intern.internCode,
    year: args.year,
    month: args.month,
    days: rows,
    totals: {
      days: counted.length,
      complete: counted.filter((r) => !r.incomplete && r.required > 0).length,
      incomplete: counted.filter((r) => r.incomplete).length,
      slotsRequired: counted.reduce((s, r) => s + r.required, 0),
      slotsFiled: counted.reduce((s, r) => s + r.filed, 0),
      compliancePercent: (() => {
        const req = counted.reduce((s, r) => s + r.required, 0);
        const fil = counted.reduce((s, r) => s + r.filed, 0);
        return req === 0 ? 0 : Math.round((fil / req) * 100);
      })(),
    },
  };
}

/** Founder excuses a missed or late slot — a power cut, a dead phone. */
export async function excuseSlot(args: {
  startupId: string;
  internId: string;
  slotStart: Date | string;
  reason: string;
  summary?: string;
  actorId: string;
}) {
  const intern = await prisma.intern.findFirst({
    where: { id: args.internId, startupId: args.startupId },
  });
  if (!intern) throw new AppError(404, "Intern not found", "NOT_FOUND");
  if (!args.reason?.trim()) throw new AppError(400, "Give a reason", "REASON_REQUIRED");

  const slotStart = new Date(args.slotStart);
  const policy = await slotPolicyFor(args.startupId);
  const found = await findSlot(intern, policy, slotStart);
  if (!found) throw new AppError(404, "No day contains that slot", "NOT_FOUND");
  const { attendance, slot } = found;

  const record = await prisma.workLog.upsert({
    where: { internId_slotStart: { internId: intern.id, slotStart: slot.start } },
    create: {
      startupId: args.startupId,
      internId: intern.id,
      attendanceId: attendance.id,
      slotStart: slot.start,
      slotEnd: slot.end,
      kind: "WORK",
      summary: args.summary?.trim() || "Excused by founder",
      status: "EXCUSED",
      excusedBy: args.actorId,
      excuseReason: args.reason.trim(),
    },
    update: {
      status: "EXCUSED",
      excusedBy: args.actorId,
      excuseReason: args.reason.trim(),
      ...(args.summary?.trim() ? { summary: args.summary.trim() } : {}),
    },
  });

  await audit({
    action: "worklog.excused",
    entity: "WorkLog",
    entityId: record.id,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { internId: intern.id, slot: slot.start.toISOString(), reason: args.reason },
  });

  return record;
}

/** Today across every active intern — the founder's daily scan. */
export async function todayAcross(startupId: string, date?: Date | string) {
  const day = R.dayOf(date ?? new Date());
  const interns = await prisma.intern.findMany({
    where: { startupId, status: { in: ["ACTIVE", "NOTICE"] } },
    select: { id: true, fullName: true, internCode: true },
    orderBy: { fullName: "asc" },
  });

  const rows = await Promise.all(
    interns.map(async (i) => {
      const d = await dayView({ internId: i.id, date: day });
      return {
        internId: i.id,
        fullName: i.fullName,
        internCode: i.internCode,
        mode: d.mode,
        attendance: d.attendance,
        compliance: d.compliance,
        hasSummary: Boolean(d.summary),
        // Blocked slots first: it is the only state that needs someone else.
        blocked: d.slots.filter((s) => s.log?.kind === "BLOCKED").map((s) => s.log!.summary),
        slots: d.slots,
      };
    })
  );

  return { date: day, rows };
}
