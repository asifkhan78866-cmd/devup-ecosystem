import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { audit } from "../shared/audit.service";

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

export async function listServices(opts?: { includeInactive?: boolean }) {
  return prisma.service.findMany({
    where: opts?.includeInactive ? {} : { isActive: true },
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
  await audit({ action: "service.updated", entity: "Service", entityId: id, actorId });
  return s;
}

/**
 * Retires a service rather than deleting it.
 *
 * Engagements point at services, and a client's record of what they bought
 * should not become a dangling reference because the offering was withdrawn.
 * Deletion is only allowed while nothing references it.
 */
export async function retireService(id: string, actorId: string) {
  const used = await prisma.engagement.count({ where: { serviceId: id } });
  if (used > 0) {
    const s = await prisma.service.update({ where: { id }, data: { isActive: false } });
    await audit({ action: "service.retired", entity: "Service", entityId: id, actorId });
    return { retired: true as const, service: s, engagements: used };
  }
  await prisma.service.delete({ where: { id } });
  await audit({ action: "service.deleted", entity: "Service", entityId: id, actorId });
  return { retired: false as const };
}
