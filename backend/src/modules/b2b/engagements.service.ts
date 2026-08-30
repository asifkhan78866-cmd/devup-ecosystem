import { EngagementStage, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { audit } from "../shared/audit.service";
import { fiscalYear, nextSequence } from "../../lib/numbering";
import { seal, open, hint, secretsAvailable } from "../../lib/secrets";
import { logger } from "../../middleware/logger";

/**
 * B2B engagements: the work between "they said yes" and "it is handed over".
 *
 * Money is in paise throughout. Rupees as floats produce invoices that are off
 * by a paisa, which is the kind of error a client's accounts team notices and
 * nobody can explain.
 */

let anchorId: string | null = null;

/** NumberSequence is keyed per startup; DevUp's own row anchors company-wide runs. */
async function anchor() {
  if (anchorId) return anchorId;
  const row =
    (await prisma.startup.findFirst({ where: { code: "DIA" }, select: { id: true } })) ??
    (await prisma.startup.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } }));
  if (!row) throw new AppError(500, "No startup row to anchor numbering to", "NO_ANCHOR");
  anchorId = row.id;
  return anchorId;
}

/** DEVUP/ENG/2026-27/0001 */
async function nextEngagementCode() {
  const a = await anchor();
  return prisma.$transaction(async (tx) => {
    const fy = fiscalYear();
    const n = await nextSequence(tx, a, "DOC_ENGAGEMENT" as never, fy);
    return `DEVUP/ENG/${fy}/${String(n).padStart(4, "0")}`;
  });
}

/** DEVUP/INV/2026-27/0001 */
async function nextInvoiceNumber() {
  const a = await anchor();
  return prisma.$transaction(async (tx) => {
    const fy = fiscalYear();
    const n = await nextSequence(tx, a, "DOC_INVOICE" as never, fy);
    return `DEVUP/INV/${fy}/${String(n).padStart(4, "0")}`;
  });
}

// ── Money ────────────────────────────────────────────────────────────────

/**
 * What has actually been received against an engagement.
 *
 * The gross amount, not the net. A client deducting TDS has still paid that
 * portion — it went to the tax authority on DevUp's behalf — so counting only
 * what landed in the bank would hold work hostage over money already paid.
 */
export async function paidSoFar(engagementId: string) {
  const rows = await prisma.payment.findMany({
    where: { engagementId },
    select: { amount: true, tdsDeducted: true },
  });
  return rows.reduce((sum, p) => sum + p.amount + p.tdsDeducted, 0);
}

export function depositDue(contractValue: number, depositPct: number) {
  return Math.ceil((contractValue * depositPct) / 100);
}

// ── Stage transitions ────────────────────────────────────────────────────

/** The order work actually happens in. */
const ORDER: EngagementStage[] = [
  "ENQUIRY", "PROPOSED", "AGREEMENT_SENT", "AGREEMENT_SIGNED",
  "DEPOSIT_PAID", "IN_BUILD", "DELIVERED", "MAINTENANCE", "CLOSED",
];

/**
 * Moves an engagement forward, refusing when the conditions are not met.
 *
 * The gate lives here rather than in the admin screen. A rule enforced only by
 * a disabled button is a rule that gets routed around on a busy day, and the
 * whole point of this one is that nobody starts building before the agreement
 * is signed and the deposit is in.
 *
 * Going backwards is allowed and audited: a mis-click should be correctable
 * without someone editing the database by hand.
 */
export async function advanceStage(id: string, to: EngagementStage, actorId: string) {
  const e = await prisma.engagement.findUnique({
    where: { id },
    include: { agreement: { select: { status: true, documentNo: true } } },
  });
  if (!e) throw new AppError(404, "Engagement not found", "NOT_FOUND");

  if (to === "LOST") {
    return applyStage(e.id, "LOST", actorId, { lostAt: true });
  }

  const from = ORDER.indexOf(e.stage);
  const target = ORDER.indexOf(to);
  if (target === -1) throw new AppError(400, "Unknown stage", "BAD_STAGE");

  // Only forward moves are gated. Correcting a mistake should not require
  // satisfying conditions that were never true.
  if (target > from) {
    if (target >= ORDER.indexOf("AGREEMENT_SIGNED")) {
      if (!e.agreement) {
        throw new AppError(409, "Link the signed agreement first", "NO_AGREEMENT");
      }
      if (e.agreement.status !== "SIGNED") {
        throw new AppError(
          409,
          `The agreement ${e.agreement.documentNo ?? ""} is ${e.agreement.status.toLowerCase()}, not signed`,
          "AGREEMENT_NOT_SIGNED"
        );
      }
    }

    if (target >= ORDER.indexOf("DEPOSIT_PAID")) {
      const due = depositDue(e.contractValue, e.depositPct);
      const paid = await paidSoFar(e.id);
      if (e.contractValue <= 0) {
        throw new AppError(409, "Set the contract value before taking a deposit", "NO_VALUE");
      }
      if (paid < due) {
        throw new AppError(
          409,
          `Deposit not met — ${formatPaise(paid)} of ${formatPaise(due)} received`,
          "DEPOSIT_SHORT"
        );
      }
    }

    if (to === "MAINTENANCE") {
      const plan = await prisma.maintenancePlan.findUnique({ where: { engagementId: e.id } });
      if (!plan) throw new AppError(409, "Set up the maintenance plan first", "NO_PLAN");
    }
  }

  return applyStage(e.id, to, actorId, {
    startedAt: to === "IN_BUILD",
    deliveredAt: to === "DELIVERED",
    closedAt: to === "CLOSED",
  });
}

async function applyStage(
  id: string,
  stage: EngagementStage,
  actorId: string,
  marks: { startedAt?: boolean; deliveredAt?: boolean; closedAt?: boolean; lostAt?: boolean }
) {
  const now = new Date();
  const updated = await prisma.engagement.update({
    where: { id },
    data: {
      stage,
      ...(marks.startedAt ? { startedAt: now } : {}),
      ...(marks.deliveredAt ? { deliveredAt: now } : {}),
      ...(marks.closedAt || marks.lostAt ? { closedAt: now } : {}),
    },
  });
  await audit({
    action: "engagement.stage_changed",
    entity: "Engagement",
    entityId: id,
    actorId,
    metadata: { stage, code: updated.code },
  });
  return updated;
}

export function formatPaise(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

// ── Engagements ──────────────────────────────────────────────────────────

export async function listEngagements(filters?: { stage?: EngagementStage; q?: string }) {
  const rows = await prisma.engagement.findMany({
    where: {
      ...(filters?.stage ? { stage: filters.stage } : {}),
      ...(filters?.q
        ? {
            OR: [
              { clientCompany: { contains: filters.q, mode: "insensitive" } },
              { clientName: { contains: filters.q, mode: "insensitive" } },
              { title: { contains: filters.q, mode: "insensitive" } },
              { code: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      service: { select: { name: true } },
      agreement: { select: { id: true, documentNo: true, status: true } },
      _count: { select: { tasks: true, deliverables: true, credentials: true } },
    },
  });

  // Paid totals in one query rather than per row.
  const totals = await prisma.payment.groupBy({
    by: ["engagementId"],
    _sum: { amount: true, tdsDeducted: true },
  });
  const paidBy = new Map(
    totals.map((t) => [t.engagementId, (t._sum.amount ?? 0) + (t._sum.tdsDeducted ?? 0)])
  );

  return rows.map((e) => ({
    ...e,
    paid: paidBy.get(e.id) ?? 0,
    depositDue: depositDue(e.contractValue, e.depositPct),
  }));
}

export async function getEngagement(id: string) {
  const e = await prisma.engagement.findUnique({
    where: { id },
    include: {
      service: true,
      agreement: { select: { id: true, documentNo: true, status: true, title: true } },
      milestones: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paidOn: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
      team: true,
      tasks: { orderBy: { sortOrder: "asc" } },
      deliverables: { orderBy: { createdAt: "asc" } },
      handover: { orderBy: { sortOrder: "asc" } },
      changes: { orderBy: { createdAt: "desc" } },
      costs: { orderBy: { incurredOn: "desc" } },
      maintenance: { include: { rates: { orderBy: { effectiveOn: "desc" } } } },
      showcase: true,
      // Never the secret itself — only that one exists.
      credentials: {
        orderBy: { provider: "asc" },
        select: {
          id: true, provider: true, accountRef: true, label: true, purpose: true,
          username: true, url: true, lastRotatedAt: true, updatedAt: true,
          secretCipher: true,
        },
      },
    },
  });
  if (!e) throw new AppError(404, "Engagement not found", "NOT_FOUND");

  const paid = await paidSoFar(id);
  const approvedChanges = e.changes
    .filter((c) => c.status === "APPROVED")
    .reduce((s, c) => s + c.amount, 0);

  return {
    ...e,
    credentials: e.credentials.map(({ secretCipher, ...c }) => ({
      ...c,
      hasSecret: Boolean(secretCipher),
    })),
    paid,
    depositDue: depositDue(e.contractValue, e.depositPct),
    // Approved scope changes are part of the contract, so the figure people
    // read has to include them or it understates what is owed.
    contractTotal: e.contractValue + approvedChanges,
    outstanding: e.contractValue + approvedChanges - paid,
  };
}

export interface EngagementInput {
  serviceId?: string | null;
  requestId?: string | null;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone?: string;
  clientGstin?: string;
  approverName?: string;
  approverEmail?: string;
  title: string;
  summary?: string;
  contractValue?: number;
  depositPct?: number;
  warrantyDays?: number;
  ownerId?: string;
}

export async function createEngagement(input: EngagementInput, actorId: string) {
  const code = await nextEngagementCode();
  const e = await prisma.engagement.create({
    data: {
      code,
      serviceId: input.serviceId ?? null,
      requestId: input.requestId ?? null,
      clientName: input.clientName.trim(),
      clientCompany: input.clientCompany.trim(),
      clientEmail: input.clientEmail.trim().toLowerCase(),
      clientPhone: input.clientPhone?.trim() || null,
      clientGstin: input.clientGstin?.trim() || null,
      approverName: input.approverName?.trim() || null,
      approverEmail: input.approverEmail?.trim() || null,
      title: input.title.trim(),
      summary: input.summary?.trim() || null,
      contractValue: input.contractValue ?? 0,
      depositPct: input.depositPct ?? 25,
      warrantyDays: input.warrantyDays ?? 30,
      ownerId: input.ownerId ?? actorId,
    },
  });

  await audit({
    action: "engagement.created",
    entity: "Engagement",
    entityId: e.id,
    actorId,
    metadata: { code, client: e.clientCompany },
  });
  return e;
}

export async function updateEngagement(id: string, input: Partial<EngagementInput> & {
  agreementId?: string | null;
  lostReason?: string;
}, actorId: string) {
  const e = await prisma.engagement.update({
    where: { id },
    data: {
      ...(input.clientName !== undefined ? { clientName: input.clientName.trim() } : {}),
      ...(input.clientCompany !== undefined ? { clientCompany: input.clientCompany.trim() } : {}),
      ...(input.clientEmail !== undefined ? { clientEmail: input.clientEmail.trim().toLowerCase() } : {}),
      ...(input.clientPhone !== undefined ? { clientPhone: input.clientPhone.trim() || null } : {}),
      ...(input.clientGstin !== undefined ? { clientGstin: input.clientGstin.trim() || null } : {}),
      ...(input.approverName !== undefined ? { approverName: input.approverName.trim() || null } : {}),
      ...(input.approverEmail !== undefined ? { approverEmail: input.approverEmail.trim() || null } : {}),
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.summary !== undefined ? { summary: input.summary.trim() || null } : {}),
      ...(input.contractValue !== undefined ? { contractValue: input.contractValue } : {}),
      ...(input.depositPct !== undefined ? { depositPct: input.depositPct } : {}),
      ...(input.warrantyDays !== undefined ? { warrantyDays: input.warrantyDays } : {}),
      ...(input.serviceId !== undefined ? { serviceId: input.serviceId } : {}),
      ...(input.agreementId !== undefined ? { agreementId: input.agreementId } : {}),
      ...(input.lostReason !== undefined ? { lostReason: input.lostReason.trim() || null } : {}),
    },
  });
  await audit({ action: "engagement.updated", entity: "Engagement", entityId: id, actorId });
  return e;
}

// ── The vault ────────────────────────────────────────────────────────────

export async function saveCredential(args: {
  engagementId: string;
  id?: string;
  provider: string;
  accountRef?: string;
  label: string;
  purpose?: string;
  username?: string;
  url?: string;
  secret?: string;
  actorId: string;
}) {
  if (args.secret && !secretsAvailable()) {
    throw new AppError(
      503,
      "CREDENTIAL_ENCRYPTION_KEY is not configured — refusing to store a secret unencrypted",
      "NO_ENCRYPTION_KEY"
    );
  }

  const sealed = args.secret ? seal(args.secret) : null;
  const data = {
    engagementId: args.engagementId,
    provider: args.provider.trim(),
    accountRef: args.accountRef?.trim() || null,
    label: args.label.trim(),
    purpose: args.purpose?.trim() || null,
    username: args.username?.trim() || null,
    url: args.url?.trim() || null,
    ...(sealed
      ? {
          secretCipher: sealed.cipher,
          secretIv: sealed.iv,
          secretTag: sealed.tag,
          lastRotatedAt: new Date(),
        }
      : {}),
  };

  const row = args.id
    ? await prisma.engagementCredential.update({ where: { id: args.id }, data })
    : await prisma.engagementCredential.create({ data });

  await audit({
    action: args.id ? "credential.updated" : "credential.created",
    entity: "EngagementCredential",
    entityId: row.id,
    actorId: args.actorId,
    // Never the secret, and never enough of it to narrow a guess.
    metadata: { provider: row.provider, label: row.label, engagementId: args.engagementId },
  });

  return { id: row.id };
}

/**
 * Reveals one secret, and records that it was revealed.
 *
 * The audit entry is the point. A vault whose reads leave no trace is a vault
 * nobody can reason about after an incident — "who had this" needs an answer,
 * and memory is not one.
 */
export async function revealCredential(id: string, actorId: string) {
  const row = await prisma.engagementCredential.findUnique({ where: { id } });
  if (!row) throw new AppError(404, "Credential not found", "NOT_FOUND");

  const secret = open({
    cipher: row.secretCipher ?? undefined,
    iv: row.secretIv ?? undefined,
    tag: row.secretTag ?? undefined,
  });

  await audit({
    action: "credential.revealed",
    entity: "EngagementCredential",
    entityId: id,
    actorId,
    metadata: { provider: row.provider, label: row.label, engagementId: row.engagementId },
  });

  if (secret === null && row.secretCipher) {
    logger.warn(`credential ${id} could not be decrypted — wrong or missing key`);
    return { secret: null, undecryptable: true as const };
  }
  return { secret, hint: secret ? hint(secret) : null };
}

export async function deleteCredential(id: string, actorId: string) {
  const row = await prisma.engagementCredential.delete({ where: { id } });
  await audit({
    action: "credential.deleted",
    entity: "EngagementCredential",
    entityId: id,
    actorId,
    metadata: { provider: row.provider, label: row.label },
  });
  return { ok: true };
}

// ── Invoices ─────────────────────────────────────────────────────────────

/**
 * Raises an invoice.
 *
 * GST is computed once and stored rather than derived on read: the rate can
 * change, and an invoice already in a client's ledger must not silently
 * change with it.
 */
export async function createInvoice(args: {
  engagementId: string;
  subtotal: number;
  gstPct?: number;
  sacCode?: string;
  sellerGstin?: string;
  dueOn?: string;
  notes?: string;
  actorId: string;
}) {
  const e = await prisma.engagement.findUnique({ where: { id: args.engagementId } });
  if (!e) throw new AppError(404, "Engagement not found", "NOT_FOUND");
  if (args.subtotal <= 0) throw new AppError(400, "An invoice needs an amount", "NO_AMOUNT");

  const gstPct = args.gstPct ?? 18;
  const gstAmount = Math.round((args.subtotal * gstPct) / 100);
  const number = await nextInvoiceNumber();

  const inv = await prisma.invoice.create({
    data: {
      engagementId: args.engagementId,
      number,
      sellerGstin: args.sellerGstin?.trim() || null,
      buyerGstin: e.clientGstin,
      sacCode: args.sacCode?.trim() || null,
      subtotal: args.subtotal,
      gstPct,
      gstAmount,
      total: args.subtotal + gstAmount,
      status: "DRAFT",
      issuedOn: new Date(),
      dueOn: args.dueOn ? new Date(args.dueOn) : null,
      notes: args.notes?.trim() || null,
    },
  });

  await audit({
    action: "invoice.created",
    entity: "Invoice",
    entityId: inv.id,
    actorId: args.actorId,
    metadata: { number, total: inv.total, engagementId: args.engagementId },
  });
  return inv;
}

export async function recordPayment(args: {
  engagementId: string;
  amount: number;
  tdsDeducted?: number;
  paidOn: string;
  method?: string;
  reference?: string;
  milestoneId?: string;
  invoiceId?: string;
  note?: string;
  actorId: string;
}) {
  if (args.amount <= 0) throw new AppError(400, "A payment needs an amount", "NO_AMOUNT");

  const p = await prisma.payment.create({
    data: {
      engagementId: args.engagementId,
      amount: args.amount,
      tdsDeducted: args.tdsDeducted ?? 0,
      paidOn: new Date(args.paidOn),
      method: args.method?.trim() || null,
      reference: args.reference?.trim() || null,
      milestoneId: args.milestoneId ?? null,
      invoiceId: args.invoiceId ?? null,
      note: args.note?.trim() || null,
    },
  });

  if (args.milestoneId) {
    await prisma.engagementMilestone.update({
      where: { id: args.milestoneId },
      data: { status: "PAID" },
    });
  }

  // An invoice is settled by what has been received against it, not by hand.
  if (args.invoiceId) {
    const inv = await prisma.invoice.findUnique({ where: { id: args.invoiceId } });
    if (inv) {
      const against = await prisma.payment.findMany({
        where: { invoiceId: args.invoiceId },
        select: { amount: true, tdsDeducted: true },
      });
      const received = against.reduce((s, x) => s + x.amount + x.tdsDeducted, 0);
      await prisma.invoice.update({
        where: { id: args.invoiceId },
        data: { status: received >= inv.total ? "PAID" : "PART_PAID" },
      });
    }
  }

  await audit({
    action: "payment.recorded",
    entity: "Payment",
    entityId: p.id,
    actorId: args.actorId,
    metadata: { engagementId: args.engagementId, amount: p.amount, tds: p.tdsDeducted },
  });
  return p;
}

// ── Maintenance ──────────────────────────────────────────────────────────

const CADENCE_MONTHS = { MONTHLY: 1, QUARTERLY: 3, ANNUAL: 12 } as const;

function addMonths(from: Date, months: number) {
  const d = new Date(from);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

export async function upsertMaintenance(args: {
  engagementId: string;
  amount: number;
  cadence?: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  startsOn?: string;
  inclusions?: string[];
  exclusions?: string[];
  note?: string;
  actorId: string;
}) {
  const existing = await prisma.maintenancePlan.findUnique({
    where: { engagementId: args.engagementId },
  });
  const cadence = args.cadence ?? existing?.cadence ?? "MONTHLY";
  const startsOn = args.startsOn ? new Date(args.startsOn) : existing?.startsOn ?? new Date();
  const renewsOn = addMonths(startsOn, CADENCE_MONTHS[cadence]);

  const plan = existing
    ? await prisma.maintenancePlan.update({
        where: { id: existing.id },
        data: {
          amount: args.amount,
          cadence,
          renewsOn,
          ...(args.inclusions ? { inclusions: args.inclusions } : {}),
          ...(args.exclusions ? { exclusions: args.exclusions } : {}),
        },
      })
    : await prisma.maintenancePlan.create({
        data: {
          engagementId: args.engagementId,
          amount: args.amount,
          cadence,
          startsOn,
          renewsOn,
          inclusions: args.inclusions ?? [],
          exclusions: args.exclusions ?? [],
        },
      });

  /**
   * Every rate is recorded, including the first.
   *
   * The amount is allowed to change — that was the requirement — but an
   * invoice raised six months ago has to remain explicable, and it cannot be
   * if the only record is the figure showing today.
   */
  if (!existing || existing.amount !== args.amount) {
    await prisma.maintenanceRate.create({
      data: {
        planId: plan.id,
        amount: args.amount,
        effectiveOn: new Date(),
        note: args.note?.trim() || null,
      },
    });
  }

  await audit({
    action: existing ? "maintenance.rate_changed" : "maintenance.created",
    entity: "MaintenancePlan",
    entityId: plan.id,
    actorId: args.actorId,
    metadata: { engagementId: args.engagementId, amount: args.amount, cadence },
  });
  return plan;
}

/** Plans renewing inside the window, so nothing lapses unnoticed. */
export async function renewalsDue(days = 14) {
  const until = new Date(Date.now() + days * 864e5);
  return prisma.maintenancePlan.findMany({
    where: { status: "ACTIVE", renewsOn: { lte: until } },
    orderBy: { renewsOn: "asc" },
    include: {
      engagement: { select: { id: true, code: true, clientCompany: true, clientEmail: true } },
    },
  });
}

// ── Acceptance ───────────────────────────────────────────────────────────

/**
 * Deliverables past their deemed-acceptance window.
 *
 * Computed on read rather than by a scheduler: Redis is off in this
 * deployment, so a job would never run, and a derived answer cannot drift
 * from the data it is derived from.
 */
export async function deemedAccepted() {
  const submitted = await prisma.deliverable.findMany({
    where: { status: "SUBMITTED", submittedAt: { not: null } },
    include: { engagement: { select: { id: true, code: true, clientCompany: true } } },
  });
  const now = Date.now();
  return submitted.filter(
    (d) => now - d.submittedAt!.getTime() >= d.deemedAfterDays * 864e5
  );
}
