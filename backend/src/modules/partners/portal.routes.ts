import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import * as perks from "./perks.service";

/**
 * Public verification and the partner portal.
 *
 * The split matters: anyone holding a ticket can *check* it, because a
 * reception desk has to verify a stranger's paper in seconds without an
 * account. Only a signed-in partner can *consume* it — otherwise scanning
 * someone's ticket out of curiosity would burn it.
 */
const router = Router();
const ok = (res: any, data: unknown, status = 200) => res.status(status).json({ success: true, data });

// ── Public ───────────────────────────────────────────
/**
 * Read-only status for a code. Returns 200 with `found: false` rather than
 * 404, so a mistyped code renders as "not found" on the page instead of
 * throwing the client into an error state.
 */
router.get("/verify/:code", async (req, res) => {
  ok(res, await perks.verifyCode(String(req.params.code)));
});

// ── Partner portal ───────────────────────────────────
/** Resolves which partners this user may act for. */
async function partnersFor(userId: string) {
  const rows = await prisma.partnerUser.findMany({
    where: { userId },
    include: { partner: true },
  });
  return rows.map((r) => ({ ...r.partner, myRole: r.role }));
}

router.get("/me/partners", requireAuth, async (req, res) => {
  const mine = await partnersFor(req.user!.id);
  ok(
    res,
    await Promise.all(
      mine.map(async (p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        logoUrl: p.logoUrl,
        brandColor: p.brandColor,
        myRole: p.myRole,
        stats: await perks.partnerStats(p.id),
      }))
    )
  );
});

/** Their own tickets — issued, redeemed, outstanding. Never another partner's. */
router.get("/me/partners/:partnerId/awards", requireAuth, async (req, res) => {
  const mine = await partnersFor(req.user!.id);
  const partnerId = req.params.partnerId as string;
  if (!mine.some((p) => p.id === partnerId)) {
    // 404 rather than 403: a 403 confirms the partner exists.
    throw new AppError(404, "Partner not found", "NOT_FOUND");
  }

  const awards = await prisma.perkAward.findMany({
    where: { perk: { partnerId } },
    include: { perk: true, redemption: true },
    orderBy: { issuedAt: "desc" },
    take: 200,
  });

  ok(
    res,
    awards.map((a) => ({
      id: a.id,
      code: a.code,
      recipientName: a.recipientName,
      sourceEvent: a.sourceEvent,
      issuedAt: a.issuedAt,
      expiresAt: a.expiresAt,
      status: perks.effectiveStatus(a),
      redeemedAt: a.redemption?.redeemedAt ?? null,
      perkTitle: a.perk.title,
    }))
  );
});

/** Consume a ticket. Scoped to a partner the caller actually belongs to. */
router.post("/me/partners/:partnerId/redeem", requireAuth, async (req, res) => {
  const mine = await partnersFor(req.user!.id);
  const partnerId = req.params.partnerId as string;
  const match = mine.find((p) => p.id === partnerId);
  if (!match) throw new AppError(404, "Partner not found", "NOT_FOUND");

  const profile = await prisma.profile.findUnique({
    where: { userId: req.user!.id },
    select: { name: true },
  });

  ok(
    res,
    await perks.redeemCode({
      code: String(req.body?.code ?? ""),
      actorUserId: req.user!.id,
      actorName: profile?.name ?? match.name,
      partnerId,
      note: req.body?.note,
    })
  );
});

// ── Recipient's own tickets ──────────────────────────
/**
 * Awards belonging to the signed-in person, matched on account *or* email.
 *
 * Most recipients are awarded before they ever sign up, so an award carrying
 * only their email still has to find them. Matching on both, then writing the
 * link back, means it resolves once and stays resolved.
 */
router.get("/me/tickets", requireAuth, async (req, res) => {
  const email = req.user!.email.toLowerCase();

  await prisma.perkAward
    .updateMany({
      where: { recipientEmail: email, userId: null },
      data: { userId: req.user!.id },
    })
    .catch(() => undefined);

  const awards = await prisma.perkAward.findMany({
    where: { OR: [{ userId: req.user!.id }, { recipientEmail: email }], status: { not: "REVOKED" } },
    include: { perk: { include: { partner: true } }, redemption: true },
    orderBy: { issuedAt: "desc" },
  });

  ok(
    res,
    awards.map((a) => ({
      id: a.id,
      code: a.code,
      status: perks.effectiveStatus(a),
      recipientName: a.recipientName,
      sourceEvent: a.sourceEvent,
      issuedAt: a.issuedAt,
      expiresAt: a.expiresAt,
      redeemedAt: a.redemption?.redeemedAt ?? null,
      pdfUrl: a.pdfUrl,
      perk: {
        title: a.perk.title,
        subtitle: a.perk.subtitle,
        finalPrice: a.perk.finalPrice,
        originalPrice: a.perk.originalPrice,
        priceUnit: a.perk.priceUnit,
        percentOff: a.perk.percentOff,
        terms: a.perk.terms,
      },
      partner: {
        name: a.perk.partner.name,
        logoUrl: a.perk.partner.logoUrl,
        brandColor: a.perk.partner.brandColor,
        address: [a.perk.partner.addressLine1, a.perk.partner.city].filter(Boolean).join(", ") || null,
        phone: a.perk.partner.contactPhone,
      },
    }))
  );
});

export default router;
