import { Prisma } from "@prisma/client";

export type SequenceKind =
  | "APPLICATION"
  | "OFFER"
  | "EMPLOYEE"
  | "INTERN"
  // HR documents each get their own per-startup, per-fiscal-year run.
  | `DOC_${string}`;

/**
 * Indian fiscal year for a date: April 1 to March 31.
 * 2026-08-03 -> "2026-27";  2026-02-10 -> "2025-26".
 */
export function fiscalYear(date = new Date()): string {
  const y = date.getFullYear();
  const startYear = date.getMonth() >= 3 ? y : y - 1; // month 3 = April
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/**
 * Atomically allocates the next value in a per-tenant sequence.
 *
 * `increment` compiles to `SET current = current + 1`, so concurrent callers are
 * serialised by the database on that row. Never replace this with count()+1 —
 * two simultaneous requests would both read the same count and produce duplicate
 * numbers. The @unique constraints on the generated columns are the backstop.
 */
export async function nextSequence(
  tx: Prisma.TransactionClient,
  startupId: string,
  kind: SequenceKind,
  period = "*"
): Promise<number> {
  const seq = await tx.numberSequence.upsert({
    where: { startupId_kind_period: { startupId, kind, period } },
    create: { startupId, kind, period, current: 1 },
    update: { current: { increment: 1 } },
    select: { current: true },
  });
  return seq.current;
}

const pad = (n: number, width: number) => String(n).padStart(width, "0");

/** APP-ZAP-000001 — perpetual per startup. */
export async function nextApplicationNo(
  tx: Prisma.TransactionClient,
  startupId: string,
  code: string
) {
  const n = await nextSequence(tx, startupId, "APPLICATION", "*");
  return `APP-${code}-${pad(n, 6)}`;
}

/** DEVUP/ZAP/OL/2026-27/0001 — resets every fiscal year. */
export async function nextOfferNo(
  tx: Prisma.TransactionClient,
  startupId: string,
  code: string,
  at = new Date()
) {
  const fy = fiscalYear(at);
  const n = await nextSequence(tx, startupId, "OFFER", fy);
  return `DEVUP/${code}/OL/${fy}/${pad(n, 4)}`;
}

/** DUE-ZAP-260001 — permanent, reused on rehire. */
export async function nextEmployeeCode(
  tx: Prisma.TransactionClient,
  startupId: string,
  code: string,
  at = new Date()
) {
  const n = await nextSequence(tx, startupId, "EMPLOYEE", "*");
  const yy = String(at.getFullYear() % 100).padStart(2, "0");
  return `DUE-${code}-${yy}${pad(n, 4)}`;
}

/** DUI-ZAP-260001 — permanent. */
export async function nextInternCode(
  tx: Prisma.TransactionClient,
  startupId: string,
  code: string,
  at = new Date()
) {
  const n = await nextSequence(tx, startupId, "INTERN", "*");
  const yy = String(at.getFullYear() % 100).padStart(2, "0");
  return `DUI-${code}-${yy}${pad(n, 4)}`;
}

/**
 * An offer lapses two days before the joining date, so there is always a short
 * buffer to arrange a replacement rather than discovering a no-show on day one.
 * Never returns a date in the past: for a joining date inside that window the
 * offer stays open until tomorrow.
 */
export function offerExpiryFor(joiningDate: Date): Date {
  const twoDaysBefore = new Date(joiningDate.getTime() - 2 * 864e5);
  const tomorrow = new Date(Date.now() + 864e5);
  return twoDaysBefore > tomorrow ? twoDaysBefore : tomorrow;
}
