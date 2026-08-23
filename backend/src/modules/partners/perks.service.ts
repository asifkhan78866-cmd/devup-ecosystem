import crypto from "crypto";
import QRCode from "qrcode";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { env } from "../../config/env";
import { uploadFile } from "../../lib/storage";
import { htmlToPdf } from "../../lib/pdf";
import { logger } from "../../middleware/logger";
import { audit } from "../shared/audit.service";
import { notify } from "../shared/notification.service";
import { Emails } from "../../lib/email/templates";
import { LOGO_URL, SITE_URL } from "../../lib/email/layout";
import { renderTicketSheet, TicketPayload } from "./ticket.template";

/**
 * Perk awards.
 *
 * DevUp awards these to named people who earned them at an event; nobody
 * claims one for themselves. The recipient usually has no account, so the
 * record is carried by name and email and links itself to a user later.
 */

/**
 * Unambiguous alphabet: no O/0, I/1, S/5 or Z/2.
 *
 * These codes get read aloud down a phone line and copied off paper by hand at
 * a reception desk, so characters that look or sound alike cost real time.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRTUVWXY346789";

/**
 * Crypto-random, never derived.
 *
 * A code that encodes anything — the price, a counter, the date — lets someone
 * guess the next one. rejection-sampled so the alphabet stays uniform rather
 * than favouring its first few characters.
 */
function randomCode(length = 6) {
  const out: string[] = [];
  const limit = 256 - (256 % ALPHABET.length);
  while (out.length < length) {
    for (const byte of crypto.randomBytes(length * 2)) {
      if (byte >= limit) continue;
      out.push(ALPHABET[byte % ALPHABET.length]);
      if (out.length === length) break;
    }
  }
  return out.join("");
}

async function uniqueCode(partnerCode: string) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = `DVP-${partnerCode}-${randomCode()}`;
    const clash = await prisma.perkAward.findUnique({ where: { code }, select: { id: true } });
    if (!clash) return code;
  }
  throw new AppError(500, "Could not allocate a unique code", "CODE_ALLOCATION_FAILED");
}

/** Awards are expired on read — no scheduler to die quietly overnight. */
export function effectiveStatus(award: { status: string; expiresAt: Date }) {
  if (award.status === "ISSUED" && award.expiresAt.getTime() < Date.now()) return "EXPIRED";
  return award.status;
}

export interface AwardRecipient {
  name: string;
  email: string;
  phone?: string;
}

export interface AwardInput {
  perkId: string;
  recipients: AwardRecipient[];
  sourceEvent?: string;
  note?: string;
  actorId: string;
  /** Skip the email; the ticket is printed and handed over in person. */
  sendEmail?: boolean;
}

export async function awardPerk(input: AwardInput) {
  const perk = await prisma.perk.findUnique({
    where: { id: input.perkId },
    include: { partner: true, _count: { select: { awards: true } } },
  });
  if (!perk) throw new AppError(404, "Perk not found", "NOT_FOUND");
  if (perk.status !== "LIVE") {
    throw new AppError(409, `This perk is ${perk.status.toLowerCase()} — only a live perk can be awarded`, "PERK_NOT_LIVE");
  }
  if (perk.partner.status !== "ACTIVE") {
    throw new AppError(409, `${perk.partner.name} is paused`, "PARTNER_PAUSED");
  }
  if (perk.validUntil && perk.validUntil.getTime() < Date.now()) {
    throw new AppError(409, "This perk's validity window has closed", "PERK_EXPIRED");
  }

  const issued: Array<{ code: string; name: string; email: string }> = [];
  const skipped: Array<{ email: string; reason: string }> = [];

  // Capacity is re-read per recipient so a long list cannot overshoot the cap.
  let awardedSoFar = perk._count.awards;

  for (const raw of input.recipients) {
    const name = raw.name?.trim();
    const email = raw.email?.trim().toLowerCase();

    if (!name || !email) {
      skipped.push({ email: email || "(blank)", reason: "name and email are both required" });
      continue;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      skipped.push({ email, reason: "not a valid email address" });
      continue;
    }
    if (perk.totalCap != null && awardedSoFar >= perk.totalCap) {
      skipped.push({ email, reason: `cap of ${perk.totalCap} reached` });
      continue;
    }

    const already = await prisma.perkAward.count({
      where: { perkId: perk.id, recipientEmail: email, status: { in: ["ISSUED", "REDEEMED"] } },
    });
    if (already >= perk.perPersonCap) {
      skipped.push({ email, reason: `already has ${already} of this perk` });
      continue;
    }

    // Link an account if one exists; claim-by-email attaches it later if not.
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    const award = await prisma.perkAward.create({
      data: {
        perkId: perk.id,
        code: await uniqueCode(perk.partner.code),
        recipientName: name,
        recipientEmail: email,
        recipientPhone: raw.phone?.trim() || null,
        userId: user?.id ?? null,
        sourceEvent: input.sourceEvent?.trim() || null,
        note: input.note?.trim() || null,
        issuedBy: input.actorId,
        expiresAt: new Date(Date.now() + perk.awardValidityDays * 864e5),
      },
    });

    awardedSoFar++;
    issued.push({ code: award.code, name, email });

    await audit({
      action: "perk.awarded",
      entity: "PerkAward",
      entityId: award.id,
      actorId: input.actorId,
      metadata: { perk: perk.title, partner: perk.partner.name, to: email, code: award.code },
    });

    if (input.sendEmail) {
      await notify({
        userId: user?.id,
        email,
        event: "SELECTED",
        title: `Your ${perk.partner.name} pass — ${award.code}`,
        message: `You have been awarded ${perk.title} from ${perk.partner.name}. Valid until ${award.expiresAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}.`,
        link: `/verify/${award.code}`,
        html: Emails.generic({
          title: `Your ${perk.partner.name} pass`,
          message:
            `Hi ${name},\n\n` +
            `You have been awarded ${perk.title} from ${perk.partner.name}.\n\n` +
            `Your code is ${award.code}. Show it at ${perk.partner.name} before ` +
            `${award.expiresAt.toLocaleDateString("en-IN", { dateStyle: "long" })}. ` +
            `It is issued in your name and cannot be transferred.`,
          link: `${SITE_URL}/verify/${award.code}`,
        }),
      });
    }
  }

  return { issued: issued.length, issuedTo: issued, skipped };
}

/** Everything the printed ticket needs, gathered per award. */
async function ticketPayloadFor(awardId: string): Promise<TicketPayload> {
  const award = await prisma.perkAward.findUnique({
    where: { id: awardId },
    include: { perk: { include: { partner: true } } },
  });
  if (!award) throw new AppError(404, "Award not found", "NOT_FOUND");

  const { perk } = award;
  const { partner } = perk;

  // Encodes the verify URL so any phone camera resolves it without an app.
  const qrDataUrl = await QRCode.toDataURL(`${SITE_URL}/verify/${award.code}`, {
    errorCorrectionLevel: "M",
    margin: 0,
    width: 320,
  }).catch(() => null);

  const address = [partner.addressLine1, partner.addressLine2, partner.city, partner.pincode]
    .filter(Boolean)
    .join(", ");

  return {
    partnerName: partner.name,
    partnerLogoUrl: partner.logoUrl,
    brandColor: partner.brandColor,
    partnerAddress: address || null,
    partnerPhone: partner.contactPhone,
    perkTitle: perk.title,
    perkSubtitle: perk.subtitle,
    headline: perk.title,
    highlights: perk.highlights,
    terms: perk.terms,
    originalPrice: perk.originalPrice,
    finalPrice: perk.finalPrice,
    priceUnit: perk.priceUnit,
    percentOff: perk.percentOff,
    recipientName: award.recipientName,
    recipientEmail: award.recipientEmail,
    sourceEvent: award.sourceEvent,
    code: award.code,
    issuedAt: award.issuedAt,
    expiresAt: award.expiresAt,
    qrDataUrl,
    devupLogoUrl: LOGO_URL,
    siteUrl: SITE_URL.replace(/^https?:\/\//, ""),
    cin: env.DEVUP_CIN,
  };
}

/**
 * Print-ready PDF for a set of awards, two to a sheet.
 *
 * Stored rather than streamed so the same file can be reprinted later without
 * re-rendering, and so a partner dispute can be settled against the exact
 * artefact that was handed over.
 */
export async function renderTickets(awardIds: string[], perSheet: 1 | 2 = 2) {
  if (awardIds.length === 0) throw new AppError(400, "Select at least one ticket", "NOTHING_TO_PRINT");

  const payloads = await Promise.all(awardIds.map(ticketPayloadFor));
  const html = renderTicketSheet(payloads, { perSheet });
  const pdf = await htmlToPdf(html);

  if (!pdf) {
    throw new AppError(
      503,
      "Could not render the tickets. PDF rendering is unavailable on this server — " +
        "install Chrome (build step: npx puppeteer browsers install chrome).",
      "PDF_UNAVAILABLE"
    );
  }

  const name = `perk-tickets/${Date.now()}-${awardIds.length}.pdf`;
  const url = await uploadFile(env.STORAGE_BUCKET_DOCUMENTS, name, pdf, "application/pdf");

  // Single awards remember their own sheet; a batch does not, since the file
  // holds several people and is not any one person's document.
  if (awardIds.length === 1) {
    await prisma.perkAward
      .update({ where: { id: awardIds[0] }, data: { pdfUrl: url } })
      .catch((err) => logger.warn(`could not link ticket pdf: ${err.message}`));
  }

  return { url, count: awardIds.length };
}

/**
 * Public check. Deliberately readable by anyone holding the code: the point is
 * that a reception desk can verify a ticket in seconds without an account.
 *
 * Returns only what the desk needs to decide — never the recipient's phone,
 * the note, or anything about other awards.
 */
export async function verifyCode(code: string) {
  const award = await prisma.perkAward.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { perk: { include: { partner: true } }, redemption: true },
  });

  if (!award) return { found: false as const };

  const status = effectiveStatus(award);
  return {
    found: true as const,
    code: award.code,
    status,
    valid: status === "ISSUED",
    recipientName: award.recipientName,
    perkTitle: award.perk.title,
    perkSubtitle: award.perk.subtitle,
    partnerName: award.perk.partner.name,
    partnerLogoUrl: award.perk.partner.logoUrl,
    brandColor: award.perk.partner.brandColor,
    finalPrice: award.perk.finalPrice,
    originalPrice: award.perk.originalPrice,
    priceUnit: award.perk.priceUnit,
    sourceEvent: award.sourceEvent,
    issuedAt: award.issuedAt,
    expiresAt: award.expiresAt,
    redeemedAt: award.redemption?.redeemedAt ?? null,
    revokeReason: award.revokeReason,
  };
}

/**
 * Consume a ticket. Requires an authenticated partner or DevUp admin — a
 * public endpoint here would let anyone burn a stranger's ticket by scanning it.
 *
 * The status guard lives in the WHERE clause, so two people scanning the same
 * paper at the same moment cannot both succeed.
 */
export async function redeemCode(args: {
  code: string;
  actorUserId: string;
  actorName?: string;
  partnerId?: string;
  note?: string;
}) {
  const award = await prisma.perkAward.findUnique({
    where: { code: args.code.trim().toUpperCase() },
    include: { perk: { include: { partner: true } }, redemption: true },
  });
  if (!award) throw new AppError(404, "No ticket with that code", "NOT_FOUND");

  // A partner may only redeem their own tickets.
  if (args.partnerId && award.perk.partnerId !== args.partnerId) {
    throw new AppError(403, "This ticket belongs to another partner", "WRONG_PARTNER");
  }

  const status = effectiveStatus(award);
  if (status === "REDEEMED") {
    throw new AppError(
      409,
      `Already redeemed on ${award.redemption?.redeemedAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}`,
      "ALREADY_REDEEMED"
    );
  }
  if (status === "EXPIRED") {
    throw new AppError(409, `Expired on ${award.expiresAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}`, "EXPIRED");
  }
  if (status === "REVOKED") {
    throw new AppError(409, award.revokeReason ?? "This ticket was revoked", "REVOKED");
  }

  const claimed = await prisma.perkAward.updateMany({
    where: { id: award.id, status: "ISSUED" },
    data: { status: "REDEEMED" },
  });
  if (claimed.count === 0) {
    throw new AppError(409, "This ticket was just redeemed elsewhere", "ALREADY_REDEEMED");
  }

  const redemption = await prisma.perkRedemption.create({
    data: {
      awardId: award.id,
      redeemedByUserId: args.actorUserId,
      redeemedByName: args.actorName,
      note: args.note,
    },
  });

  await audit({
    action: "perk.redeemed",
    entity: "PerkAward",
    entityId: award.id,
    actorId: args.actorUserId,
    metadata: { code: award.code, partner: award.perk.partner.name, recipient: award.recipientName },
  });

  return {
    code: award.code,
    recipientName: award.recipientName,
    perkTitle: award.perk.title,
    partnerName: award.perk.partner.name,
    redeemedAt: redemption.redeemedAt,
  };
}

export async function revokeAward(awardId: string, reason: string, actorId: string) {
  const award = await prisma.perkAward.findUnique({ where: { id: awardId } });
  if (!award) throw new AppError(404, "Award not found", "NOT_FOUND");
  if (award.status === "REDEEMED") {
    throw new AppError(409, "This ticket has already been used and cannot be revoked", "ALREADY_REDEEMED");
  }

  const updated = await prisma.perkAward.update({
    where: { id: awardId },
    data: { status: "REVOKED", revokedAt: new Date(), revokeReason: reason || "Revoked" },
  });

  await audit({
    action: "perk.revoked",
    entity: "PerkAward",
    entityId: awardId,
    actorId,
    metadata: { code: award.code, reason },
  });

  return updated;
}

/** Counts a partner sees, and the evidence DevUp shows them at renewal. */
export async function partnerStats(partnerId: string) {
  const perks = await prisma.perk.findMany({ where: { partnerId }, select: { id: true } });
  const perkIds = perks.map((p) => p.id);
  if (perkIds.length === 0) return { perks: 0, issued: 0, redeemed: 0, outstanding: 0, expired: 0 };

  const awards = await prisma.perkAward.findMany({
    where: { perkId: { in: perkIds } },
    select: { status: true, expiresAt: true },
  });

  const counts = awards.reduce<Record<string, number>>((acc, a) => {
    const s = effectiveStatus(a);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return {
    perks: perkIds.length,
    issued: awards.length,
    redeemed: counts.REDEEMED ?? 0,
    outstanding: counts.ISSUED ?? 0,
    expired: counts.EXPIRED ?? 0,
  };
}

/**
 * A sample ticket for one perk, before anybody has been awarded it.
 *
 * Built from the perk alone with a placeholder recipient and an obviously fake
 * code, so the design and the wording can be checked without creating a real
 * award. Awarding is not reversible in any way that matters — the recipient is
 * emailed and the code is live — so being able to look first is the difference
 * between catching a typo and reprinting a stack.
 */
// Two to a sheet, matching how they actually print: rendering one alone
// stretches it to fill an A4 page and shows proportions nobody will ever hold.
export async function renderPerkPreview(perkId: string, perSheet: 1 | 2 = 2) {
  const perk = await prisma.perk.findUnique({
    where: { id: perkId },
    include: { partner: true },
  });
  if (!perk) throw new AppError(404, "Perk not found", "NOT_FOUND");

  const { partner } = perk;
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + perk.awardValidityDays * 864e5);

  // A code that cannot be mistaken for a real one, and a QR that resolves to
  // the verify page so the scan can be tested end to end.
  const code = "PREVIEW-SAMPLE";
  const qrDataUrl = await QRCode.toDataURL(`${SITE_URL}/verify/${code}`, {
    errorCorrectionLevel: "M",
    margin: 0,
    width: 320,
  }).catch(() => null);

  const address = [partner.addressLine1, partner.addressLine2, partner.city, partner.pincode]
    .filter(Boolean)
    .join(", ");

  const payload: TicketPayload = {
    partnerName: partner.name,
    partnerLogoUrl: partner.logoUrl,
    brandColor: partner.brandColor,
    partnerAddress: address || null,
    partnerPhone: partner.contactPhone,
    perkTitle: perk.title,
    perkSubtitle: perk.subtitle,
    headline: perk.title,
    highlights: perk.highlights,
    terms: perk.terms,
    originalPrice: perk.originalPrice,
    finalPrice: perk.finalPrice,
    priceUnit: perk.priceUnit,
    percentOff: perk.percentOff,
    recipientName: "Student Name",
    recipientEmail: null,
    sourceEvent: null,
    code,
    issuedAt,
    expiresAt,
    qrDataUrl,
    devupLogoUrl: LOGO_URL,
    siteUrl: SITE_URL.replace(/^https?:\/\//, ""),
    cin: env.DEVUP_CIN,
  };

  // Two copies, because a ticket is `flex: 1` inside a fixed-height sheet: one
  // alone stretches to fill A4 and shows a shape nobody will ever hold. Two is
  // also what actually comes off the printer, cut guide and all.
  return renderTicketSheet(perSheet === 2 ? [payload, payload] : [payload], { perSheet });
}
