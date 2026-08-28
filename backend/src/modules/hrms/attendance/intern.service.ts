import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { audit } from "../../shared/audit.service";
import * as R from "./rules";
import { slotPolicyFor } from "./worklog.service";

/** The policy for a startup, falling back to the platform default. */
export async function policyFor(startupId: string): Promise<R.Policy> {
  const row = await prisma.attendancePolicy.findUnique({ where: { startupId } });
  return row ? { ...R.DEFAULT_POLICY, ...row } : R.DEFAULT_POLICY;
}

async function internOrThrow(internId: string, userId?: string) {
  const intern = await prisma.intern.findFirst({
    where: { id: internId, ...(userId ? { userId } : {}) },
  });
  if (!intern) throw new AppError(404, "Intern record not found", "NOT_FOUND");
  return intern;
}

/**
 * Everything the intern's own dashboard needs for today.
 *
 * Deliberately excludes anything about money: stipend arithmetic is founder
 * -only, and the whole point of a separate read model is that the intern's
 * endpoint cannot leak it even by accident.
 */
export async function today(internId: string, userId?: string) {
  const intern = await internOrThrow(internId, userId);
  const policy = await policyFor(intern.startupId);
  const date = R.dayOf(new Date());

  const working = R.isWorkingDay(policy, date) && date >= R.dayOf(intern.startDate) && date <= R.dayOf(intern.endDate);
  const mode = R.modeFor(intern.officeDays, date);
  const record = await prisma.attendance.findUnique({
    where: { internId_date: { internId, date } },
  });

  const live = record?.checkIn
    ? R.gradeDay({ policy, mode, date, checkIn: record.checkIn, checkOut: record.checkOut })
    : null;

  return {
    date,
    isWorkingDay: working,
    mode,
    officeStart: policy.officeStart,
    officeEnd: policy.officeEnd,
    requiredMinutes: mode === "OFFICE" ? policy.minOfficeMinutes : policy.minRemoteMinutes,
    checkIn: record?.checkIn ?? null,
    checkOut: record?.checkOut ?? null,
    // While the day is open this is time-so-far, not a verdict.
    workedMinutes: live?.workedMinutes ?? record?.workedMinutes ?? 0,
    status: record?.checkOut ? record.status : live ? `${live.status} (in progress)` : null,
    canCheckIn: working && !record?.checkIn,
    canCheckOut: Boolean(record?.checkIn && !record.checkOut),
  };
}

export async function checkIn(args: { internId: string; userId: string; note?: string }) {
  const intern = await internOrThrow(args.internId, args.userId);
  const policy = await policyFor(intern.startupId);
  const now = new Date();
  const date = R.dayOf(now);

  if (date < R.dayOf(intern.startDate)) {
    throw new AppError(400, "Your internship has not started yet", "NOT_STARTED");
  }
  if (date > R.dayOf(intern.endDate)) {
    throw new AppError(400, "Your internship has ended", "ENDED");
  }
  if (!R.isWorkingDay(policy, date)) {
    throw new AppError(400, "Today is not a working day", "NOT_A_WORKING_DAY");
  }

  const existing = await prisma.attendance.findUnique({
    where: { internId_date: { internId: args.internId, date } },
  });
  if (existing?.checkIn) {
    throw new AppError(409, "You have already checked in today", "ALREADY_CHECKED_IN");
  }

  const mode = R.modeFor(intern.officeDays, date);

  // OPEN, not a grade. Judging a day at the moment it starts would record
  // ABSENT for zero minutes worked, and that is what gets read if they never
  // check out.
  const record = await prisma.attendance.upsert({
    where: { internId_date: { internId: args.internId, date } },
    create: {
      startupId: intern.startupId,
      internId: args.internId,
      date,
      mode,
      status: "OPEN",
      checkIn: now,
      source: "SELF",
      note: args.note,
    },
    update: { checkIn: now, mode, status: "OPEN", source: "SELF", note: args.note },
  });

  await audit({
    action: "attendance.check_in",
    entity: "Attendance",
    entityId: record.id,
    actorId: args.userId,
    startupId: intern.startupId,
    metadata: { internId: args.internId, mode, at: now.toISOString() },
  });

  return record;
}

export async function checkOut(args: { internId: string; userId: string; note?: string }) {
  const intern = await internOrThrow(args.internId, args.userId);
  const policy = await policyFor(intern.startupId);
  const now = new Date();
  const date = R.dayOf(now);

  const existing = await prisma.attendance.findUnique({
    where: { internId_date: { internId: args.internId, date } },
  });
  if (!existing?.checkIn) throw new AppError(409, "You have not checked in today", "NOT_CHECKED_IN");
  if (existing.checkOut) throw new AppError(409, "You have already checked out today", "ALREADY_CHECKED_OUT");

  const graded = R.gradeDay({
    policy,
    mode: existing.mode as R.AttendanceMode,
    date,
    checkIn: existing.checkIn,
    checkOut: now,
  });

  const record = await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      checkOut: now,
      status: graded.status,
      workedMinutes: graded.workedMinutes,
      note: args.note ?? existing.note,
    },
  });

  await audit({
    action: "attendance.check_out",
    entity: "Attendance",
    entityId: record.id,
    actorId: args.userId,
    startupId: intern.startupId,
    metadata: { internId: args.internId, minutes: graded.workedMinutes, status: graded.status },
  });

  return record;
}

/**
 * A month of days for one intern, with missing past days derived as ABSENT.
 *
 * Nothing writes those rows. Redis is off so there is no scheduler to run a
 * nightly job, and a job that silently dies would leave a month unmarked; a
 * working day in the past with no record simply *is* an absence, so it is
 * computed on read and always correct.
 */
export async function month(args: {
  internId: string;
  year: number;
  month: number;
  userId?: string;
}) {
  const intern = await internOrThrow(args.internId, args.userId);
  const policy = await policyFor(intern.startupId);

  const days = R.workingDaysIn({
    policy,
    year: args.year,
    month: args.month,
    from: intern.startDate,
    to: intern.endDate,
  });

  const records = await prisma.attendance.findMany({
    where: {
      internId: args.internId,
      date: { gte: days[0] ?? new Date(0), lte: days[days.length - 1] ?? new Date(0) },
    },
    // The updates decide the day, so the month view has to read them too —
    // otherwise the intern's own calendar says PRESENT for a day the payout
    // counts as absent, and the first they hear of it is the money.
    include: { workLogs: { select: { kind: true } }, daySummary: { select: { id: true } } },
  });
  const byDate = new Map(records.map((r) => [r.date.getTime(), r]));
  const today = R.dayOf(new Date());
  const slotPolicy = await slotPolicyFor(intern.startupId);

  const entries = days.map((d) => {
    const rec = byDate.get(d.getTime());
    const mode = R.modeFor(intern.officeDays, d);
    if (rec) {
      // A day left OPEN in the past is settled here rather than stored, so a
      // later correction of the check-out still grades cleanly.
      const stale = rec.status === "OPEN" && d.getTime() < today.getTime() && rec.checkIn;
      const settled = stale
        ? R.gradeUnclosedDay({ policy, mode: rec.mode as R.AttendanceMode, date: d, checkIn: rec.checkIn! })
        : null;

      const clockStatus = (settled ? settled.status : rec.status) as R.AttendanceStatus;
      const slots = rec.checkIn
        ? R.slotsForDay({
            policy: slotPolicy,
            date: d,
            mode: rec.mode as R.AttendanceMode,
            checkIn: rec.checkIn,
            checkOut: rec.checkOut,
          })
        : [];
      const filed = (rec.workLogs ?? []).filter((l) =>
        R.countsTowardCompliance(l.kind as R.WorkKind)
      ).length;
      const accounted = R.applyAccountability({
        policy: slotPolicy,
        status: clockStatus,
        requiredSlots: slots.length,
        filedSlots: filed,
      });

      return {
        date: d,
        mode: rec.mode,
        status: accounted.status,
        checkIn: rec.checkIn,
        checkOut: rec.checkOut,
        workedMinutes: settled ? settled.workedMinutes : rec.workedMinutes,
        needsAttention: Boolean(settled) || accounted.downgraded,
        note: accounted.reason ?? (settled ? settled.note : rec.note),
        slotsRequired: slots.length,
        slotsFiled: filed,
      };
    }
    // Today with no check-in yet is still pending, not yet an absence.
    if (d.getTime() >= today.getTime()) {
      return { date: d, mode, status: "PENDING", checkIn: null, checkOut: null, workedMinutes: 0, needsAttention: false, note: null };
    }
    return { date: d, mode, status: "ABSENT", checkIn: null, checkOut: null, workedMinutes: 0, needsAttention: false, note: null };
  });

  const totals = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  const counted = entries.filter((e) => e.status !== "PENDING").length;
  const credited =
    (totals.PRESENT ?? 0) + (totals.LATE ?? 0) + (totals.HALF_DAY ?? 0) * 0.5 + (totals.LEAVE ?? 0);

  return {
    internId: args.internId,
    year: args.year,
    month: args.month,
    workingDays: days.length,
    entries,
    totals,
    attendancePercent: counted > 0 ? Math.round((credited / counted) * 100) : 0,
  };
}

/** Founder/HR view: every active intern's state for one day. */
export async function rosterFor(startupId: string, date: string | Date) {
  const policy = await policyFor(startupId);
  const day = R.dayOf(date);

  const interns = await prisma.intern.findMany({
    where: { startupId, status: { in: ["ACTIVE", "NOTICE"] } },
    select: {
      id: true, internCode: true, fullName: true, designation: true,
      officeDays: true, startDate: true, endDate: true,
    },
    orderBy: { fullName: "asc" },
  });

  const records = await prisma.attendance.findMany({ where: { startupId, date: day } });
  const byIntern = new Map(records.map((r) => [r.internId, r]));
  const today = R.dayOf(new Date());
  const isWorking = R.isWorkingDay(policy, day);

  const roster = interns.map((i) => {
    const inRange = day >= R.dayOf(i.startDate) && day <= R.dayOf(i.endDate);
    const rec = byIntern.get(i.id);
    const mode = R.modeFor(i.officeDays, day);
    let status: string;
    if (!isWorking || !inRange) status = "OFF";
    else if (rec) status = rec.status;
    else if (day.getTime() >= today.getTime()) status = "PENDING";
    else status = "ABSENT";

    return {
      internId: i.id,
      internCode: i.internCode,
      fullName: i.fullName,
      designation: i.designation,
      mode,
      status,
      checkIn: rec?.checkIn ?? null,
      checkOut: rec?.checkOut ?? null,
      workedMinutes: rec?.workedMinutes ?? 0,
    };
  });

  return {
    date: day,
    isWorkingDay: isWorking,
    roster,
    summary: roster.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

/** HR correction — marking for someone, or fixing a forgotten check-out. */
export async function markForIntern(args: {
  startupId: string;
  internId: string;
  date: string | Date;
  status: R.AttendanceStatus;
  note?: string;
  actorId: string;
}) {
  const intern = await prisma.intern.findFirst({
    where: { id: args.internId, startupId: args.startupId },
  });
  if (!intern) throw new AppError(404, "Intern not found", "NOT_FOUND");

  const date = R.dayOf(args.date);
  if (date > R.dayOf(new Date())) {
    throw new AppError(400, "Cannot mark attendance for a future date", "FUTURE_DATE");
  }

  const mode = R.modeFor(intern.officeDays, date);
  const record = await prisma.attendance.upsert({
    where: { internId_date: { internId: args.internId, date } },
    create: {
      startupId: args.startupId, internId: args.internId, date, mode,
      status: args.status, source: "HR", note: args.note,
    },
    update: { status: args.status, source: "HR", note: args.note },
  });

  await audit({
    action: "attendance.marked",
    entity: "Attendance",
    entityId: record.id,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { internId: args.internId, date: date.toISOString().slice(0, 10), status: args.status },
  });

  return record;
}

/** Assign which weekdays an intern is on site. */
export async function setOfficeDays(args: {
  startupId: string;
  internId: string;
  officeDays: number[];
  actorId: string;
}) {
  const policy = await policyFor(args.startupId);
  const invalid = args.officeDays.filter((d) => !policy.workingDays.includes(d));
  if (invalid.length) {
    throw new AppError(400, `Days ${invalid.join(", ")} are not working days`, "INVALID_DAYS");
  }

  const intern = await prisma.intern.findFirst({
    where: { id: args.internId, startupId: args.startupId },
  });
  if (!intern) throw new AppError(404, "Intern not found", "NOT_FOUND");

  const updated = await prisma.intern.update({
    where: { id: args.internId },
    data: { officeDays: [...new Set(args.officeDays)].sort() },
  });

  await audit({
    action: "attendance.office_days_set",
    entity: "Intern",
    entityId: args.internId,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { officeDays: updated.officeDays },
  });

  return updated;
}
