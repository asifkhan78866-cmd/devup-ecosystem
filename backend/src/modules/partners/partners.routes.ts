import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { audit } from "../shared/audit.service";
import * as perks from "./perks.service";

/**
 * Partner and perk administration.
 *
 * Platform admins only, throughout. Partners never publish their own offers:
 * every perk that reaches a member was approved by DevUp, which is the whole
 * point of the arrangement.
 */
const router = Router();
const ok = (res: any, data: unknown, status = 200) => res.status(status).json({ success: true, data });
const adminOnly = [requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"])];

// ── Partners ─────────────────────────────────────────
const partnerBody = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    code: z.string().min(2).max(6).regex(/^[A-Za-z0-9]+$/, "Letters and digits only"),
    slug: z.string().min(2).max(80).optional(),
    logoUrl: z.string().url().optional().or(z.literal("")),
    brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    category: z.enum(["WORKSPACE", "PROGRAM", "COUNCIL", "SERVICE", "OTHER"]).optional(),
    website: z.string().url().optional().or(z.literal("")),
    contactName: z.string().max(120).optional().or(z.literal("")),
    contactPhone: z.string().max(30).optional().or(z.literal("")),
    contactEmail: z.string().email().optional().or(z.literal("")),
    addressLine1: z.string().max(160).optional().or(z.literal("")),
    addressLine2: z.string().max(160).optional().or(z.literal("")),
    city: z.string().max(80).optional().or(z.literal("")),
    state: z.string().max(80).optional().or(z.literal("")),
    pincode: z.string().max(10).optional().or(z.literal("")),
    agreementStart: z.coerce.date().optional(),
    agreementEnd: z.coerce.date().optional(),
    startupId: z.string().uuid().optional().or(z.literal("")),
  }),
});

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

router.get("/", ...adminOnly, async (_req, res) => {
  const partners = await prisma.partner.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { perks: true } } },
  });

  ok(
    res,
    await Promise.all(
      partners.map(async (p) => ({ ...p, stats: await perks.partnerStats(p.id) }))
    )
  );
});

router.post("/", ...adminOnly, validate(partnerBody), async (req, res) => {
  const b = req.body;
  const partner = await prisma.partner.create({
    data: {
      name: b.name,
      code: String(b.code).toUpperCase(),
      slug: b.slug || slugify(b.name),
      logoUrl: b.logoUrl || null,
      brandColor: b.brandColor || "#1F7A4D",
      category: b.category ?? "OTHER",
      website: b.website || null,
      contactName: b.contactName || null,
      contactPhone: b.contactPhone || null,
      contactEmail: b.contactEmail || null,
      addressLine1: b.addressLine1 || null,
      addressLine2: b.addressLine2 || null,
      city: b.city || null,
      state: b.state || null,
      pincode: b.pincode || null,
      agreementStart: b.agreementStart ?? null,
      agreementEnd: b.agreementEnd ?? null,
      startupId: b.startupId || null,
    },
  });

  await audit({
    action: "partner.created",
    entity: "Partner",
    entityId: partner.id,
    actorId: req.user!.id,
    metadata: { name: partner.name, code: partner.code },
  });

  ok(res, partner, 201);
});

router.patch("/:id", ...adminOnly, async (req, res) => {
  const { code, id, createdAt, updatedAt, ...rest } = req.body ?? {};
  const data: Record<string, unknown> = {};
  // Only copy keys that were actually sent, so a partial form does not blank
  // fields it never showed.
  for (const [k, v] of Object.entries(rest)) data[k] = v === "" ? null : v;

  const partner = await prisma.partner.update({ where: { id: req.params.id as string }, data });
  await audit({
    action: "partner.updated",
    entity: "Partner",
    entityId: partner.id,
    actorId: req.user!.id,
    metadata: { fields: Object.keys(data) },
  });
  ok(res, partner);
});

// ── Perks ────────────────────────────────────────────
const perkBody = z.object({
  body: z.object({
    partnerId: z.string().uuid(),
    title: z.string().min(2).max(160),
    subtitle: z.string().max(240).optional().or(z.literal("")),
    description: z.string().max(4000).optional().or(z.literal("")),
    type: z.enum(["PERCENT_OFF", "FLAT_OFF", "FREE_ACCESS", "REFERRAL"]).optional(),
    percentOff: z.coerce.number().int().min(0).max(100).optional(),
    originalPrice: z.coerce.number().int().min(0).optional(),
    finalPrice: z.coerce.number().int().min(0).optional(),
    priceUnit: z.string().max(40).optional().or(z.literal("")),
    highlights: z.array(z.string().max(60)).optional(),
    terms: z.array(z.string().max(300)).optional(),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
    totalCap: z.coerce.number().int().min(1).optional(),
    perPersonCap: z.coerce.number().int().min(1).optional(),
    awardValidityDays: z.coerce.number().int().min(1).max(730).optional(),
  }),
});

router.get("/perks/all", ...adminOnly, async (req, res) => {
  const where = req.query.partnerId ? { partnerId: String(req.query.partnerId) } : {};
  const list = await prisma.perk.findMany({
    where,
    include: { partner: true, _count: { select: { awards: true } } },
    orderBy: { createdAt: "desc" },
  });

  ok(
    res,
    list.map((p) => ({
      ...p,
      awardsIssued: p._count.awards,
      remaining: p.totalCap != null ? Math.max(0, p.totalCap - p._count.awards) : null,
    }))
  );
});

router.post("/perks", ...adminOnly, validate(perkBody), async (req, res) => {
  const b = req.body;
  const perk = await prisma.perk.create({
    data: {
      partnerId: b.partnerId,
      title: b.title,
      subtitle: b.subtitle || null,
      description: b.description || null,
      type: b.type ?? "PERCENT_OFF",
      percentOff: b.percentOff ?? null,
      originalPrice: b.originalPrice ?? null,
      finalPrice: b.finalPrice ?? null,
      priceUnit: b.priceUnit || null,
      highlights: b.highlights ?? [],
      terms: b.terms ?? [],
      validFrom: b.validFrom ?? null,
      validUntil: b.validUntil ?? null,
      totalCap: b.totalCap ?? null,
      perPersonCap: b.perPersonCap ?? 1,
      awardValidityDays: b.awardValidityDays ?? 60,
    },
  });

  await audit({
    action: "perk.created",
    entity: "Perk",
    entityId: perk.id,
    actorId: req.user!.id,
    metadata: { title: perk.title },
  });

  ok(res, perk, 201);
});

router.patch("/perks/:id", ...adminOnly, async (req, res) => {
  const { id, partnerId, createdAt, updatedAt, status, ...rest } = req.body ?? {};
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) data[k] = v === "" ? null : v;
  ok(res, await prisma.perk.update({ where: { id: req.params.id as string }, data }));
});

/**
 * The approval gate. A perk only becomes awardable when DevUp says so, and
 * status is the one field the edit route above refuses to touch.
 */
/**
 * What a ticket for this perk will look like, before anyone is awarded one.
 * Returns HTML so it opens instantly — no Chromium, no stored file.
 */
router.get("/perks/:id/preview", ...adminOnly, async (req, res) => {
  const html = await perks.renderPerkPreview(req.params.id as string);
  res.type("html").send(html);
});

router.post("/perks/:id/status", ...adminOnly, async (req, res) => {
  const next = String(req.body?.status ?? "").toUpperCase();
  if (!["DRAFT", "LIVE", "PAUSED", "EXPIRED"].includes(next)) {
    throw new AppError(400, "Unknown status", "INVALID_STATUS");
  }

  const perk = await prisma.perk.update({
    where: { id: req.params.id as string },
    data: {
      status: next as "DRAFT" | "LIVE" | "PAUSED" | "EXPIRED",
      ...(next === "LIVE" ? { approvedBy: req.user!.id, approvedAt: new Date() } : {}),
    },
  });

  await audit({
    action: "perk.status_changed",
    entity: "Perk",
    entityId: perk.id,
    actorId: req.user!.id,
    metadata: { status: next },
  });

  ok(res, perk);
});

// ── Awards ───────────────────────────────────────────
router.get("/awards", ...adminOnly, async (req, res) => {
  const where: Record<string, unknown> = {};
  if (req.query.perkId) where.perkId = String(req.query.perkId);
  if (req.query.partnerId) where.perk = { partnerId: String(req.query.partnerId) };
  if (req.query.q) {
    const q = String(req.query.q);
    where.OR = [
      { recipientName: { contains: q, mode: "insensitive" } },
      { recipientEmail: { contains: q, mode: "insensitive" } },
      { code: { contains: q.toUpperCase() } },
    ];
  }

  const awards = await prisma.perkAward.findMany({
    where,
    include: { perk: { include: { partner: true } }, redemption: true },
    orderBy: { issuedAt: "desc" },
    take: 300,
  });

  ok(
    res,
    awards.map((a) => ({
      id: a.id,
      code: a.code,
      recipientName: a.recipientName,
      recipientEmail: a.recipientEmail,
      sourceEvent: a.sourceEvent,
      issuedAt: a.issuedAt,
      expiresAt: a.expiresAt,
      status: perks.effectiveStatus(a),
      pdfUrl: a.pdfUrl,
      redeemedAt: a.redemption?.redeemedAt ?? null,
      perk: { id: a.perk.id, title: a.perk.title },
      partner: { id: a.perk.partner.id, name: a.perk.partner.name, brandColor: a.perk.partner.brandColor },
    }))
  );
});

const awardBody = z.object({
  body: z.object({
    perkId: z.string().uuid(),
    recipients: z
      .array(z.object({ name: z.string().min(1), email: z.string().min(3), phone: z.string().optional() }))
      .min(1)
      .max(300),
    sourceEvent: z.string().max(160).optional().or(z.literal("")),
    note: z.string().max(500).optional().or(z.literal("")),
    sendEmail: z.boolean().optional(),
  }),
});

router.post("/awards", ...adminOnly, validate(awardBody), async (req, res) => {
  ok(
    res,
    await perks.awardPerk({
      perkId: req.body.perkId,
      recipients: req.body.recipients,
      sourceEvent: req.body.sourceEvent,
      note: req.body.note,
      sendEmail: req.body.sendEmail === true,
      actorId: req.user!.id,
    }),
    201
  );
});

router.post("/awards/print", ...adminOnly, async (req, res) => {
  const ids: string[] = Array.isArray(req.body?.awardIds) ? req.body.awardIds : [];
  const perSheet = req.body?.perSheet === 1 ? 1 : 2;
  ok(res, await perks.renderTickets(ids, perSheet));
});

router.post("/awards/:id/revoke", ...adminOnly, async (req, res) => {
  ok(res, await perks.revokeAward(req.params.id as string, req.body?.reason ?? "", req.user!.id));
});

/** DevUp can redeem on a partner's behalf — the fallback when their desk cannot. */
router.post("/awards/redeem", ...adminOnly, async (req, res) => {
  ok(
    res,
    await perks.redeemCode({
      code: String(req.body?.code ?? ""),
      actorUserId: req.user!.id,
      actorName: "DevUp Ecosystem",
      note: req.body?.note,
    })
  );
});

// ── Partner logins (phase 3) ─────────────────────────
router.get("/:id/users", ...adminOnly, async (req, res) => {
  const users = await prisma.partnerUser.findMany({
    where: { partnerId: req.params.id as string },
    include: { user: { select: { email: true, profile: { select: { name: true } } } } },
  });
  ok(res, users.map((u) => ({ id: u.id, email: u.email, role: u.role, name: u.user.profile?.name ?? null })));
});

router.post("/:id/users", ...adminOnly, async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!email) throw new AppError(400, "Email is required", "EMAIL_REQUIRED");

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    throw new AppError(
      404,
      `${email} has no DevUp account yet. Ask them to sign up first, then add them here.`,
      "USER_NOT_FOUND"
    );
  }

  const partnerUser = await prisma.partnerUser.upsert({
    where: { partnerId_userId: { partnerId: req.params.id as string, userId: user.id } },
    create: {
      partnerId: req.params.id as string,
      userId: user.id,
      email,
      role: req.body?.role === "OWNER" ? "OWNER" : "STAFF",
    },
    update: { role: req.body?.role === "OWNER" ? "OWNER" : "STAFF" },
  });

  await audit({
    action: "partner.user_added",
    entity: "PartnerUser",
    entityId: partnerUser.id,
    actorId: req.user!.id,
    metadata: { email, partnerId: req.params.id },
  });

  ok(res, partnerUser, 201);
});

router.delete("/:id/users/:userId", ...adminOnly, async (req, res) => {
  await prisma.partnerUser.deleteMany({
    where: { partnerId: req.params.id as string, id: req.params.userId as string },
  });
  ok(res, { removed: true });
});

export default router;
