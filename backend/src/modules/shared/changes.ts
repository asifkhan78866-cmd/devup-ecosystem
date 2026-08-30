import { prisma } from "../../lib/prisma";

/**
 * Working out what an edit actually changed, and reading it back.
 *
 * A form posts every field on every save, so auditing the submitted payload
 * records "edited everything" each time somebody fixes a typo — which conveys
 * as little as recording nothing. Comparing against the stored row leaves a
 * trail somebody can actually read six weeks later.
 */

/** Fields whose value differs from what is stored. */
export function changedFields(
  before: Record<string, unknown>,
  input: Record<string, unknown>
): string[] {
  const changed: string[] = [];

  for (const [key, next] of Object.entries(input)) {
    if (next === undefined) continue;
    const prev = before[key];

    // Trailing whitespace is not an edit, and neither is null versus "".
    const norm = (v: unknown) =>
      v === null || v === undefined
        ? ""
        : typeof v === "string"
        ? v.trim()
        : Array.isArray(v) || typeof v === "object"
        ? JSON.stringify(v)
        : String(v);

    if (norm(prev) !== norm(next)) changed.push(key);
  }
  return changed;
}

/** camelCase is a schema detail; the person reading the trail did not write it. */
const READABLE: Record<string, string> = {
  contractValue: "contract value",
  depositPct: "deposit %",
  clientCompany: "client company",
  clientName: "contact name",
  clientEmail: "email",
  clientGstin: "client GSTIN",
  approverName: "approver",
  approverEmail: "approver email",
  warrantyDays: "warranty period",
  agreementId: "linked agreement",
  lostReason: "reason lost",
  whatsIncluded: "what is included",
  engagementType: "engagement type",
  categoryLabel: "category",
  priceFrom: "price from",
  sortOrder: "order",
  isActive: "visibility",
  short: "one-line description",
};

export const readable = (field: string) =>
  READABLE[field] ?? field.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export interface ActivityEntry {
  id: string;
  action: string;
  at: Date;
  by: string | null;
  summary: string;
}

/**
 * The trail for one record, phrased for a person.
 *
 * Actor ids are resolved to emails in one query rather than per row — a busy
 * engagement accrues a lot of these, and the trail is read far more often than
 * it is written.
 */
export async function activityFor(entity: string, entityId: string): Promise<ActivityEntry[]> {
  const rows = await prisma.auditLog.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const ids = [...new Set(rows.map((r) => r.adminId).filter(Boolean))] as string[];
  const users = ids.length
    ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true } })
    : [];
  const emailOf = new Map(users.map((u) => [u.id, u.email]));

  return rows.map((r) => {
    const meta = (r.metadata ?? {}) as Record<string, unknown>;
    const fields = Array.isArray(meta.fields) ? (meta.fields as string[]) : [];

    let summary: string;
    if (r.action.endsWith(".updated")) {
      summary = fields.length
        ? `Updated ${fields.map(readable).join(", ")}`
        : "Saved with no changes";
    } else if (r.action.endsWith(".removed")) {
      summary = meta.reason ? `Removed — ${meta.reason}` : "Removed";
    } else if (r.action.endsWith(".restored")) {
      summary = "Restored";
    } else if (r.action.endsWith(".created")) {
      summary = "Created";
    } else if (r.action === "engagement.stage_changed") {
      summary = `Moved to ${String(meta.stage ?? "").replace(/_/g, " ").toLowerCase()}`;
    } else if (r.action === "credential.revealed") {
      summary = `Revealed ${meta.label ?? "a credential"}`;
    } else if (r.action === "payment.recorded") {
      summary = `Recorded a payment of ₹${Number(meta.amount ?? 0) / 100}`;
    } else {
      summary = r.action.replace(/[._]/g, " ");
    }

    return {
      id: r.id,
      action: r.action,
      at: r.createdAt,
      by: r.adminId ? emailOf.get(r.adminId) ?? r.adminId : null,
      summary,
    };
  });
}
