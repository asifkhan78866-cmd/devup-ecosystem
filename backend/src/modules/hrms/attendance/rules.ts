/**
 * Attendance rules, in one place.
 *
 * Everything here is pure: given a policy, a date and a pair of timestamps it
 * returns a status. No database, no clock — so the same function grades a live
 * check-out, a back-dated correction and a month-end payout run identically,
 * and can be tested without a server.
 *
 * Times are IST. Attendance is a human, local concept: a day runs 00:00–23:59
 * where the person is, not in UTC, and a check-in at 10:04 in Hyderabad must
 * never land on the previous day because the server is in another zone.
 */

export const IST_OFFSET_MINUTES = 330; // +05:30

export interface Policy {
  workingDays: number[];
  officeStart: string;
  officeEnd: string;
  graceMinutes: number;
  lateHalfDayAfter: string;
  minOfficeMinutes: number;
  minRemoteMinutes: number;
  paidLeavesPerMonth: number;
}

export type AttendanceMode = "OFFICE" | "REMOTE";
export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "HALF_DAY"
  | "ABSENT"
  | "LEAVE"
  | "HOLIDAY"
  /** Checked in, day still running — not yet a verdict. */
  | "OPEN";

/**
 * The IST calendar day an instant belongs to, as midnight UTC.
 *
 * Read in IST, not UTC: 00:30 on the 5th in Hyderabad is 19:00 on the 4th in
 * UTC, so a naive UTC read files a late-evening remote session under the
 * previous day — and then marks the person absent for a day they worked.
 */
export function dayOf(input: string | Date): Date {
  const ist = new Date(new Date(input).getTime() + IST_OFFSET_MINUTES * 60_000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}

/** ISO weekday, 1=Mon .. 7=Sun, read in IST. */
export function isoWeekday(date: Date): number {
  const ist = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  const day = ist.getUTCDay(); // 0=Sun
  return day === 0 ? 7 : day;
}

/** "10:00" on the given day, as a UTC instant. */
export function timeOnDay(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(dayOf(date).getTime() + (h * 60 + m - IST_OFFSET_MINUTES) * 60_000);
}

/** The IST wall-clock time of an instant, as minutes past midnight. */
export function istMinutes(at: Date): number {
  const ist = new Date(at.getTime() + IST_OFFSET_MINUTES * 60_000);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
}

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Is this a day the person is expected to work at all? */
export function isWorkingDay(policy: Policy, date: Date): boolean {
  return policy.workingDays.includes(isoWeekday(date));
}

/** Office or remote, from the intern's assigned on-site weekdays. */
export function modeFor(officeDays: number[], date: Date): AttendanceMode {
  return officeDays.includes(isoWeekday(date)) ? "OFFICE" : "REMOTE";
}

/**
 * Grades a day from what was actually worked.
 *
 * Office days carry two independent tests — arrive on time, and put in the
 * hours. They agree by construction: with a 10:00–16:00 day and a 5-hour
 * minimum, arriving at 11:00 is exactly the last moment both can be satisfied.
 * Keeping them separate still matters, because someone who arrives at 10:30 and
 * leaves at 13:00 is late *and* short, and should be graded on the worse of the
 * two rather than excused by the first rule that passes.
 */
export function gradeDay(args: {
  policy: Policy;
  mode: AttendanceMode;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
}): { status: AttendanceStatus; workedMinutes: number } {
  const { policy, mode, checkIn, checkOut } = args;

  if (!checkIn) return { status: "ABSENT", workedMinutes: 0 };

  // Still open: credit the time so far so the live timer is honest, but do not
  // pass judgement — the day is not over.
  const end = checkOut ?? new Date();
  const workedMinutes = Math.max(0, Math.round((end.getTime() - checkIn.getTime()) / 60_000));

  if (mode === "REMOTE") {
    if (workedMinutes >= policy.minRemoteMinutes) return { status: "PRESENT", workedMinutes };
    if (workedMinutes >= policy.minRemoteMinutes / 2) return { status: "HALF_DAY", workedMinutes };
    return { status: "ABSENT", workedMinutes };
  }

  const arrival = istMinutes(checkIn);
  const onTimeBy = hhmmToMinutes(policy.officeStart) + policy.graceMinutes;
  const halfDayAfter = hhmmToMinutes(policy.lateHalfDayAfter);

  // Worst outcome wins: too late and too short are separate failures.
  if (arrival > halfDayAfter || workedMinutes < policy.minOfficeMinutes) {
    if (workedMinutes < policy.minOfficeMinutes / 2) return { status: "ABSENT", workedMinutes };
    return { status: "HALF_DAY", workedMinutes };
  }
  if (arrival > onTimeBy) return { status: "LATE", workedMinutes };
  return { status: "PRESENT", workedMinutes };
}

/**
 * Grades a day that was left open — checked in, never checked out.
 *
 * Two bad options: credit nothing, which punishes someone who genuinely worked
 * and simply closed their laptop; or credit the full day, which makes "forget
 * to check out" the most profitable thing an intern can do. So an office day is
 * closed at its scheduled end and graded honestly on arrival time, while a
 * remote day — where there is no scheduled end to lean on and no evidence of
 * hours — settles at half. Both are flagged for HR rather than applied silently.
 */
export function gradeUnclosedDay(args: {
  policy: Policy;
  mode: AttendanceMode;
  date: Date;
  checkIn: Date;
}): { status: AttendanceStatus; workedMinutes: number; note: string } {
  const { policy, mode, date, checkIn } = args;

  if (mode === "REMOTE") {
    return {
      status: "HALF_DAY",
      workedMinutes: 0,
      note: "No check-out recorded — credited as half day",
    };
  }

  const closeAt = timeOnDay(date, policy.officeEnd);
  const graded = gradeDay({ policy, mode, date, checkIn, checkOut: closeAt });
  return {
    ...graded,
    note: `No check-out recorded — closed at ${policy.officeEnd}`,
  };
}

/** What a status is worth in pay, ×100 to avoid fractions. */
export function centidaysFor(status: AttendanceStatus, paidLeaveRemaining: number): number {
  switch (status) {
    case "PRESENT":
    case "LATE":
      return 100; // lateness is visible, not deducted
    case "HALF_DAY":
      return 50;
    case "LEAVE":
      return paidLeaveRemaining > 0 ? 100 : 0;
    case "HOLIDAY":
      return 100;
    default:
      return 0;
  }
}

/**
 * Working days in a month, clipped to the intern's own start and end dates so
 * someone who joins on the 10th is not marked absent for the 1st to the 9th.
 */
export function workingDaysIn(args: {
  policy: Policy;
  year: number;
  month: number; // 1-12
  from?: Date | null;
  to?: Date | null;
}): Date[] {
  const { policy, year, month } = args;
  const first = new Date(Date.UTC(year, month - 1, 1));
  const last = new Date(Date.UTC(year, month, 0));
  const from = args.from ? dayOf(args.from) : null;
  const to = args.to ? dayOf(args.to) : null;

  const days: Date[] = [];
  for (let d = new Date(first); d <= last; d = new Date(d.getTime() + 864e5)) {
    if (!isWorkingDay(policy, d)) continue;
    if (from && d < from) continue;
    if (to && d > to) continue;
    days.push(new Date(d));
  }
  return days;
}

export const DEFAULT_POLICY: Policy = {
  workingDays: [1, 2, 3, 4, 5, 6],
  officeStart: "10:00",
  officeEnd: "16:00",
  graceMinutes: 15,
  lateHalfDayAfter: "11:00",
  minOfficeMinutes: 300,
  minRemoteMinutes: 240,
  paidLeavesPerMonth: 1,
};

/* ─────────────────────────────────────────────────────────
   Work updates.

   Attendance answers "were they here". These answer "what did they do" — a
   different claim, and the one that actually matters. Everything below is
   pure, so the same functions grade a live slot, a back-dated correction and a
   month-end payout run identically.
   ───────────────────────────────────────────────────────── */

export interface SlotPolicy extends Policy {
  slotMinutes: number;
  fileAfterMinutes: number;
  fileGraceMinutes: number;
  minSlotCompliance: number;
  noSummaryFactor: number;
  proRataByCompliance: boolean;
}

export const DEFAULT_SLOT_POLICY: SlotPolicy = {
  ...DEFAULT_POLICY,
  slotMinutes: 90,
  fileAfterMinutes: 45,
  fileGraceMinutes: 15,
  minSlotCompliance: 0.6,
  noSummaryFactor: 0.75,
  proRataByCompliance: true,
};

export interface Slot {
  start: Date;
  end: Date;
  index: number;
}

/**
 * The reporting slots for one day.
 *
 * Office days run on the scheduled window, so every intern in the building is
 * on the same rhythm. Remote days run from when they actually checked in —
 * somebody working 8pm to midnight still owes the same account of their time,
 * and forcing 10:00 slots on them would mark a full evening as missed.
 *
 * A trailing part-slot only counts if it is at least half a slot long; nobody
 * owes a written update for the last eleven minutes of a day.
 */
export function slotsForDay(args: {
  policy: SlotPolicy;
  date: Date;
  mode: AttendanceMode;
  checkIn: Date | null;
  checkOut: Date | null;
}): Slot[] {
  const { policy, date, mode, checkIn, checkOut } = args;
  const len = policy.slotMinutes * 60_000;

  const from =
    mode === "OFFICE"
      ? timeOnDay(date, policy.officeStart)
      : checkIn ?? timeOnDay(date, policy.officeStart);

  const scheduledEnd =
    mode === "OFFICE"
      ? timeOnDay(date, policy.officeEnd)
      : new Date((checkIn ?? from).getTime() + policy.minRemoteMinutes * 60_000);

  // Slots cover the *committed* window, not the attended one: an office day's
  // schedule, or a remote day's minimum hours. Leaving after ninety minutes
  // does not reduce what was owed — it just means most of it goes unreported,
  // which is exactly what the compliance factor is there to price.
  // Working past the end still has to be accounted for, so the window extends.
  const to = checkOut
    ? new Date(Math.max(checkOut.getTime(), from.getTime()))
    : scheduledEnd;
  const end = new Date(Math.max(to.getTime(), scheduledEnd.getTime()));

  const slots: Slot[] = [];
  let cursor = from.getTime();
  let index = 0;
  while (cursor < end.getTime()) {
    const slotEnd = Math.min(cursor + len, end.getTime());
    if (slotEnd - cursor >= len / 2) {
      slots.push({ start: new Date(cursor), end: new Date(slotEnd), index });
      index++;
    }
    cursor += len;
  }
  return slots;
}

export type SlotState = "PENDING" | "OPEN" | "ON_TIME" | "LATE" | "MISSED" | "EXCUSED";

/** Whether a slot can be filed right now, and what filing it would count as. */
export function slotWindow(policy: SlotPolicy, slot: Slot, now = new Date()) {
  const opensAt = new Date(slot.start.getTime() + policy.fileAfterMinutes * 60_000);
  const closesAt = new Date(slot.end.getTime() + policy.fileGraceMinutes * 60_000);
  return {
    opensAt,
    closesAt,
    isOpen: now >= opensAt && now <= closesAt,
    hasPassed: now > closesAt,
    notYet: now < opensAt,
  };
}

/**
 * Share of a day's slots that were accounted for.
 *
 * LATE counts — the account exists, it just arrived after the window, and the
 * lateness is recorded on the entry itself. EXCUSED counts because a founder
 * decided it should. Only silence counts against them.
 */
export function slotCompliance(required: number, filed: number) {
  if (required <= 0) return 1;
  return Math.min(1, filed / required);
}

/**
 * What a day is worth once its updates are taken into account.
 *
 * Pro-rata by design: you are paid for the time you accounted for. On a
 * four-slot day, one missing update costs a quarter of the day, and a day
 * below the compliance floor is INCOMPLETE regardless of how present they
 * were. Missing the end-of-day summary caps the day separately, because
 * turning up and going home without saying what happened is its own failure.
 */
export function dayWorkFactor(args: {
  policy: SlotPolicy;
  requiredSlots: number;
  filedSlots: number;
  hasSummary: boolean;
}): { factor: number; compliance: number; incomplete: boolean } {
  const { policy, requiredSlots, filedSlots, hasSummary } = args;

  // A day with nothing to report — leave, holiday, a non-working day — is not
  // penalised for having no updates.
  if (requiredSlots === 0) return { factor: 1, compliance: 1, incomplete: false };

  const compliance = slotCompliance(requiredSlots, filedSlots);
  const incomplete = compliance < policy.minSlotCompliance || !hasSummary;

  let factor = policy.proRataByCompliance ? compliance : compliance >= policy.minSlotCompliance ? 1 : 0.5;
  if (!hasSummary) factor = Math.min(factor, policy.noSummaryFactor);

  return { factor: Math.max(0, Math.min(1, factor)), compliance, incomplete };
}

/**
 * Folds the day's reporting into its attendance verdict.
 *
 * Presence used to be decided by the clock alone: check in, check out six hours
 * later, and the register said PRESENT even if the intern filed nothing all day
 * and nobody could say what they did. Pay already fell to zero in that case, so
 * the money was right and the record was not — and the record is what gets read
 * in a review, shown to a college, and used to argue about the money later.
 *
 * Being in the building is now the ceiling, not the verdict:
 *   nothing filed at all      -> ABSENT. Time nobody can vouch for is not attendance.
 *   below the compliance floor -> HALF_DAY at best, however long they stayed.
 *
 * Deliberately one-way. It can lower a day and never raise one, so a run of
 * updates can never turn a short day into a full one.
 *
 * Days with nothing to report — leave, holiday, a day off — are untouched.
 */
export function applyAccountability(args: {
  policy: SlotPolicy;
  status: AttendanceStatus;
  requiredSlots: number;
  filedSlots: number;
}): { status: AttendanceStatus; downgraded: boolean; reason: string | null } {
  const { policy, status, requiredSlots, filedSlots } = args;
  const untouched = { status, downgraded: false, reason: null };

  // Nothing was owed, or the day already carries its own verdict.
  if (requiredSlots <= 0) return untouched;
  if (status === "LEAVE" || status === "HOLIDAY" || status === "ABSENT" || status === "OPEN") {
    return untouched;
  }

  if (filedSlots <= 0) {
    return {
      status: "ABSENT",
      downgraded: true,
      reason: `Present but unaccounted — no updates filed against ${requiredSlots} required`,
    };
  }

  const compliance = slotCompliance(requiredSlots, filedSlots);
  if (compliance < policy.minSlotCompliance && status !== "HALF_DAY") {
    return {
      status: "HALF_DAY",
      downgraded: true,
      reason:
        `Only ${filedSlots} of ${requiredSlots} updates filed ` +
        `(${Math.round(compliance * 100)}%, floor is ${Math.round(policy.minSlotCompliance * 100)}%)`,
    };
  }

  return untouched;
}

export const WORK_KINDS = ["WORK", "MEETING", "BREAK", "BLOCKED", "TRAVEL"] as const;
export type WorkKind = (typeof WORK_KINDS)[number];

/** Breaks are not work, so they are neither required nor counted against pay. */
export function countsTowardCompliance(kind: WorkKind) {
  return kind !== "BREAK";
}
