import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { audit } from "../../shared/audit.service";

export const ATTENDANCE_STATUS = ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY", "WFH"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[number];

/** Normalise to midnight UTC so one calendar day is exactly one row. */
function dayOf(input: string | Date) {
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function mark(args: {
  db: any;
  startupId: string;
  employeeId: string;
  date: string | Date;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  note?: string;
  actorId: string;
}) {
  const employee = await args.db.employee.findFirst({ where: { id: args.employeeId } });
  if (!employee) throw new AppError(404, "Employee not found", "NOT_FOUND");

  const date = dayOf(args.date);
  if (date > dayOf(new Date())) {
    throw new AppError(400, "Cannot mark attendance for a future date", "FUTURE_DATE");
  }

  // One row per employee per day — re-marking corrects rather than duplicates.
  const record = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: args.employeeId, date } },
    create: {
      startupId: args.startupId,
      employeeId: args.employeeId,
      date,
      status: args.status,
      checkIn: args.checkIn ? new Date(args.checkIn) : null,
      checkOut: args.checkOut ? new Date(args.checkOut) : null,
      note: args.note,
    },
    update: {
      status: args.status,
      checkIn: args.checkIn ? new Date(args.checkIn) : null,
      checkOut: args.checkOut ? new Date(args.checkOut) : null,
      note: args.note,
    },
  });

  await audit({
    action: "attendance.marked",
    entity: "Attendance",
    entityId: record.id,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { employeeId: args.employeeId, date: date.toISOString().slice(0, 10), status: args.status },
  });

  return record;
}

export async function bulkMark(args: {
  db: any;
  startupId: string;
  date: string | Date;
  entries: Array<{ employeeId: string; status: AttendanceStatus }>;
  actorId: string;
}) {
  const date = dayOf(args.date);
  const ids = args.entries.map((e) => e.employeeId);

  // Every employee must belong to this tenant before anything is written.
  const valid = await args.db.employee.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const validIds = new Set(valid.map((v: any) => v.id));
  const rejected = ids.filter((id) => !validIds.has(id));
  if (rejected.length) {
    throw new AppError(400, `${rejected.length} employee(s) do not belong to this startup`, "INVALID_EMPLOYEES");
  }

  await prisma.$transaction(
    args.entries.map((e) =>
      prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: e.employeeId, date } },
        create: { startupId: args.startupId, employeeId: e.employeeId, date, status: e.status },
        update: { status: e.status },
      })
    )
  );

  await audit({
    action: "attendance.bulk_marked",
    entity: "Attendance",
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { date: date.toISOString().slice(0, 10), count: args.entries.length },
  });

  return { marked: args.entries.length, date };
}

/** Roster for one day: every active employee, with their mark if present. */
export async function forDate(db: any, date: string | Date) {
  const day = dayOf(date);
  const [employees, marks] = await Promise.all([
    db.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true, employeeCode: true, department: true, designation: true },
      orderBy: { fullName: "asc" },
    }),
    db.attendance.findMany({ where: { date: day } }),
  ]);

  const byEmployee = new Map(marks.map((m: any) => [m.employeeId, m]));
  return {
    date: day,
    roster: employees.map((e: any) => ({ ...e, attendance: byEmployee.get(e.id) ?? null })),
    summary: marks.reduce((acc: Record<string, number>, m: any) => {
      acc[m.status] = (acc[m.status] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

/** Per-employee monthly view plus totals, for payroll and reports. */
export async function monthly(db: any, employeeId: string, year: number, month: number) {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 0));

  const records = await db.attendance.findMany({
    where: { employeeId, date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });

  const totals = records.reduce((acc: Record<string, number>, r: any) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const workingDays = (totals.PRESENT ?? 0) + (totals.WFH ?? 0) + (totals.HALF_DAY ?? 0) * 0.5;

  return { employeeId, year, month, records, totals, workingDays };
}
