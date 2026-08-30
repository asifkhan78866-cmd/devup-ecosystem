import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { audit } from "../shared/audit.service";
import { changedFields } from "../shared/changes";

/**
 * The service catalogue.
 *
 * Lifted out of the frontend's hardcoded array so a service can be added,
 * repriced or retired without a deploy. The public site reads the same rows,
 * so the list a client sees and the list an engagement is created against
 * cannot drift apart.
 */

export interface ServiceInput {
  slug?: string;
  name: string;
  category: string;
  categoryLabel: string;
  icon?: string;
  short: string;
  tagline?: string;
  size?: string;
  whyDevUp?: unknown;
  whatsIncluded?: string[];
  howItWorks?: unknown;
  engagementType?: string;
  priceFrom?: number;
  isActive?: boolean;
  sortOrder?: number;
}

/** Slugs are URLs; a name is not. */
function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function listServices(opts?: { includeInactive?: boolean; includeRemoved?: boolean }) {
  return prisma.service.findMany({
    where: {
      ...(opts?.includeRemoved ? {} : { deletedAt: null }),
      ...(opts?.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getService(idOrSlug: string) {
  const s = await prisma.service.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
  if (!s) throw new AppError(404, "Service not found", "NOT_FOUND");
  return s;
}

export async function createService(input: ServiceInput, actorId: string) {
  const slug = (input.slug?.trim() || slugify(input.name)) as string;
  if (!slug) throw new AppError(400, "Give the service a name", "NO_NAME");

  const clash = await prisma.service.findUnique({ where: { slug } });
  if (clash) throw new AppError(409, `A service already uses the slug "${slug}"`, "SLUG_TAKEN");

  const s = await prisma.service.create({
    data: {
      slug,
      name: input.name.trim(),
      category: input.category.trim(),
      categoryLabel: input.categoryLabel.trim(),
      icon: input.icon?.trim() || null,
      short: input.short.trim(),
      tagline: input.tagline?.trim() || null,
      size: input.size ?? "small",
      whyDevUp: (input.whyDevUp ?? null) as never,
      whatsIncluded: input.whatsIncluded ?? [],
      howItWorks: (input.howItWorks ?? null) as never,
      engagementType: input.engagementType?.trim() || null,
      priceFrom: input.priceFrom ?? null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  });

  await audit({ action: "service.created", entity: "Service", entityId: s.id, actorId, metadata: { slug } });
  return s;
}

export async function updateService(id: string, input: Partial<ServiceInput>, actorId: string) {
  /**
   * What actually changed, not what was submitted.
   *
   * A form posts every field on every save, so auditing the payload would
   * record "edited everything" each time somebody fixed a typo — which is the
   * same as recording nothing. Comparing against the stored row leaves a trail
   * that can be read.
   */
  const before = await prisma.service.findUnique({ where: { id } });
  const changed = before ? changedFields(before as Record<string, unknown>, input) : [];

  const s = await prisma.service.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.category !== undefined ? { category: input.category.trim() } : {}),
      ...(input.categoryLabel !== undefined ? { categoryLabel: input.categoryLabel.trim() } : {}),
      ...(input.icon !== undefined ? { icon: input.icon.trim() || null } : {}),
      ...(input.short !== undefined ? { short: input.short.trim() } : {}),
      ...(input.tagline !== undefined ? { tagline: input.tagline.trim() || null } : {}),
      ...(input.size !== undefined ? { size: input.size } : {}),
      ...(input.whyDevUp !== undefined ? { whyDevUp: input.whyDevUp as never } : {}),
      ...(input.whatsIncluded !== undefined ? { whatsIncluded: input.whatsIncluded } : {}),
      ...(input.howItWorks !== undefined ? { howItWorks: input.howItWorks as never } : {}),
      ...(input.engagementType !== undefined ? { engagementType: input.engagementType.trim() || null } : {}),
      ...(input.priceFrom !== undefined ? { priceFrom: input.priceFrom } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });
  await audit({
    action: "service.updated",
    entity: "Service",
    entityId: id,
    actorId,
    metadata: { fields: changed, name: s.name },
  });
  return s;
}

/**
 * Marks a service removed. It is never deleted.
 *
 * Engagements point at services, and a client's record of what they bought
 * should not become a dangling reference because the offering was withdrawn —
 * nor should the audit trail attached to it lose the thing it describes. The
 * row stays, flagged, and drops out of every list that does not ask for it.
 */
export async function retireService(id: string, actorId: string, reason?: string) {
  const used = await prisma.engagement.count({ where: { serviceId: id } });
  const s = await prisma.service.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: actorId,
      deleteReason: reason?.trim() || null,
    },
  });
  await audit({
    action: "service.removed",
    entity: "Service",
    entityId: id,
    actorId,
    metadata: { name: s.name, engagements: used, reason: reason ?? null },
  });
  return { removed: true as const, service: s, engagements: used };
}

/** Puts a removed service back. */
export async function restoreService(id: string, actorId: string) {
  const s = await prisma.service.update({
    where: { id },
    data: { deletedAt: null, deletedBy: null, deleteReason: null, isActive: true },
  });
  await audit({
    action: "service.restored", entity: "Service", entityId: id, actorId,
    metadata: { name: s.name },
  });
  return s;
}
