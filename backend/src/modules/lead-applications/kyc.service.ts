import { randomBytes } from "crypto";
import { LeadKycDocType, LeadKycStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { env } from "../../config/env";
import { uploadPrivateFile, signedUrl } from "../../lib/storage";
import { logger } from "../../middleware/logger";
import { audit } from "../shared/audit.service";
import { resend, MAIL_FROM } from "../../lib/resend";
import { Emails } from "../../lib/email/templates";
import { SITE_URL } from "../../lib/email/layout";

/**
 * Document verification for people selected into the Lead DevUp directorate.
 *
 * Deliberately account-free. The applicants have no DevUp login and no reason
 * to make one; a mandatory step behind a signup is a step that quietly stops
 * happening. Instead each request carries a single-use token in its link, and
 * the link expires.
 *
 * Nothing here ever touches the public bucket. These are identity scans, and
 * they get the private bucket and short-lived signed reads like every other
 * identity document.
 */

/** How long an upload link stays good. Long enough to find a scanner. */
const LINK_DAYS = 7;

/**
 * What every appointee must produce.
 *
 * Four items and no more. Bank details are not collected: no money flows to a
 * director, so an account number would be pure liability. Aadhaar is not
 * required either — a private company cannot demand it under the Aadhaar Act,
 * and any of the accepted photo IDs answers the same question.
 */
export const REQUIRED_DOCS: Array<{
  docType: LeadKycDocType;
  label: string;
  hint: string;
  /** Options where the applicant may choose which document to give. */
  choices?: string[];
}> = [
  {
    docType: "GOVERNMENT_PHOTO_ID",
    label: "Government photo ID",
    hint: "Any one of these. Cover all but the last four digits if you prefer — we only record those.",
    choices: ["PAN", "Passport", "Driving Licence", "Voter ID"],
  },
  {
    docType: "COLLEGE_ID",
    label: "College ID card",
    hint: "Both sides if the reverse carries the validity date.",
  },
  {
    docType: "ENROLMENT_PROOF",
    label: "Proof of enrolment",
    hint: "Bonafide certificate, admission letter or a current fee receipt.",
  },
  {
    docType: "PHOTOGRAPH",
    label: "Passport photograph",
    hint: "Plain background, face clearly visible. This one goes on your certificate.",
  },
];

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** Only the tail is kept; the rest is not ours to hold. */
export function maskNumber(raw?: string | null) {
  const clean = String(raw ?? "").replace(/\s+/g, "").toUpperCase();
  if (clean.length < 4) return null;
  return `••••${clean.slice(-4)}`;
}

export function uploadUrl(token: string) {
  // The company origin: this is part of being appointed, not part of the
  // product, and the applicant has no workspace to go to.
  return `${SITE_URL.replace(/\/$/, "")}/verify/documents/${token}`;
}

/**
 * Creates the request, or returns the one already outstanding.
 *
 * Idempotent on purpose: marking somebody selected twice, or pressing the
 * button again because the first click seemed slow, must not mint a second
 * link and silently invalidate the one already in their inbox.
 */
export async function requestKyc(applicationId: string, actorId: string) {
  const app = await prisma.leadApplication.findUnique({
    where: { id: applicationId },
    include: { kyc: { include: { documents: true } } },
  });
  if (!app) throw new AppError(404, "Application not found", "NOT_FOUND");
  if (app.status !== "SELECTED") {
    throw new AppError(409, "Mark the application Selected first", "NOT_SELECTED");
  }

  const existing = app.kyc;
  if (existing && existing.status !== "EXPIRED" && existing.expiresAt > new Date()) {
    return { kyc: existing, created: false };
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + LINK_DAYS * 864e5);

  const kyc = existing
    ? await prisma.leadKyc.update({
        where: { id: existing.id },
        data: { token, expiresAt, status: "PENDING", remindersSent: 0, lastRemindAt: null },
        include: { documents: true },
      })
    : await prisma.leadKyc.create({
        data: {
          applicationId,
          token,
          expiresAt,
          documents: { create: REQUIRED_DOCS.map((d) => ({ docType: d.docType })) },
        },
        include: { documents: true },
      });

  await audit({
    action: "lead.kyc_requested",
    entity: "LeadKyc",
    entityId: kyc.id,
    actorId,
    metadata: { applicationId, email: app.email },
  });

  return { kyc, created: true };
}

/** Sends (or resends) the upload link to the applicant. */
export async function sendKycRequest(applicationId: string, actorId: string) {
  const { kyc } = await requestKyc(applicationId, actorId);
  const app = await prisma.leadApplication.findUnique({ where: { id: applicationId } });
  if (!app) throw new AppError(404, "Application not found", "NOT_FOUND");

  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to: app.email,
    subject: "Before we can appoint you — a few documents",
    html: Emails.leadKycRequest({
      fullName: app.fullName,
      role: app.role
        .split("_")
        .map((w) => w[0] + w.slice(1).toLowerCase())
        .join(" "),
      uploadUrl: uploadUrl(kyc.token),
      expiresAt: kyc.expiresAt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      documents: REQUIRED_DOCS.map((d) => ({
        label: d.label,
        hint: d.choices ? `${d.choices.join(", ")} — any one. ${d.hint}` : d.hint,
      })),
    }),
  });

  if (error) {
    logger.error(`KYC request to ${app.email} failed: ${error.message}`);
    throw new AppError(502, `Could not send the email: ${error.message}`, "SEND_FAILED");
  }

  const updated = await prisma.leadKyc.update({
    where: { id: kyc.id },
    data: { lastRemindAt: new Date(), remindersSent: { increment: 1 } },
  });

  return { sentTo: app.email, expiresAt: updated.expiresAt, remindersSent: updated.remindersSent };
}

/**
 * The applicant's own view of their request, by token.
 *
 * Returns only what the person holding the link already knows about themselves.
 * A token that has expired or been superseded gets a flat answer rather than an
 * explanation — the link is the credential, so a wrong one is told nothing.
 */
export async function kycByToken(token: string) {
  const kyc = await prisma.leadKyc.findUnique({
    where: { token },
    include: {
      documents: true,
      application: { select: { fullName: true, role: true, college: true } },
    },
  });
  if (!kyc) return { found: false as const };
  if (kyc.expiresAt < new Date() && kyc.status !== "APPROVED") {
    return { found: false as const, expired: true as const };
  }

  const byType = new Map(kyc.documents.map((d) => [d.docType, d]));
  return {
    found: true as const,
    status: kyc.status,
    fullName: kyc.application.fullName,
    office: kyc.application.role
      .split("_")
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join(" "),
    reviewNote: kyc.reviewNote,
    expiresAt: kyc.expiresAt,
    documents: REQUIRED_DOCS.map((r) => {
      const d = byType.get(r.docType);
      return {
        docType: r.docType,
        label: r.label,
        hint: r.hint,
        choices: r.choices ?? null,
        status: d?.status ?? "MISSING",
        fileName: d?.fileName ?? null,
        idKind: d?.idKind ?? null,
        rejectReason: d?.rejectReason ?? null,
      };
    }),
  };
}

/** Accepts one file against one requirement. */
export async function uploadKycDocument(args: {
  token: string;
  docType: LeadKycDocType;
  idKind?: string;
  number?: string;
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number };
}) {
  const kyc = await prisma.leadKyc.findUnique({ where: { token: args.token } });
  if (!kyc) throw new AppError(404, "This link is not valid", "BAD_TOKEN");
  if (kyc.expiresAt < new Date()) throw new AppError(410, "This link has expired", "EXPIRED");
  if (kyc.status === "APPROVED") {
    throw new AppError(409, "Your documents have already been approved", "ALREADY_APPROVED");
  }

  if (!ALLOWED_MIME.includes(args.file.mimetype)) {
    throw new AppError(400, "Upload a JPG, PNG or PDF", "BAD_TYPE");
  }
  if (args.file.size > MAX_BYTES) {
    throw new AppError(400, "That file is over 8MB — please compress it", "TOO_LARGE");
  }

  const path = `lead-kyc/${kyc.id}/${args.docType}-${Date.now()}-${args.file.originalname}`;
  const storagePath = await uploadPrivateFile(
    env.STORAGE_BUCKET_IDENTITY,
    path,
    args.file.buffer,
    args.file.mimetype
  );

  await prisma.leadKycDocument.update({
    where: { kycId_docType: { kycId: kyc.id, docType: args.docType } },
    data: {
      storagePath,
      fileName: args.file.originalname,
      fileSize: args.file.size,
      mimeType: args.file.mimetype,
      idKind: args.idKind?.trim() || null,
      maskedNumber: maskNumber(args.number),
      // A re-upload replaces a rejected file and clears the rejection with it.
      status: "SUBMITTED",
      rejectReason: null,
      submittedAt: new Date(),
      reviewedAt: null,
    },
  });

  // Back to SUBMITTED once anything changes, so a rejected set returns to the
  // queue rather than sitting in REJECTED with a fixed document attached.
  await prisma.leadKyc.update({
    where: { id: kyc.id },
    data: { status: "SUBMITTED", submittedAt: new Date(), reviewNote: null },
  });

  return { ok: true };
}

/** Reviewer's view, with links that expire in minutes. */
export async function reviewQueue() {
  const rows = await prisma.leadKyc.findMany({
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    include: {
      documents: true,
      application: { select: { id: true, fullName: true, email: true, role: true, college: true, state: true, city: true } },
    },
  });

  return Promise.all(
    rows.map(async (k) => ({
      id: k.id,
      applicationId: k.applicationId,
      status: k.status,
      applicant: k.application,
      expiresAt: k.expiresAt,
      submittedAt: k.submittedAt,
      reviewNote: k.reviewNote,
      remindersSent: k.remindersSent,
      documents: await Promise.all(
        REQUIRED_DOCS.map(async (r) => {
          const d = k.documents.find((x) => x.docType === r.docType);
          return {
            docType: r.docType,
            label: r.label,
            status: d?.status ?? "MISSING",
            fileName: d?.fileName ?? null,
            idKind: d?.idKind ?? null,
            maskedNumber: d?.maskedNumber ?? null,
            rejectReason: d?.rejectReason ?? null,
            url: d?.storagePath
              ? await signedUrl(env.STORAGE_BUCKET_IDENTITY, d.storagePath, 300)
              : null,
          };
        })
      ),
    }))
  );
}

/** Approves or rejects one document. */
export async function reviewDocument(args: {
  kycId: string;
  docType: LeadKycDocType;
  approve: boolean;
  reason?: string;
  actorId: string;
}) {
  if (!args.approve && !args.reason?.trim()) {
    throw new AppError(400, "Say why it was rejected — they see this", "NO_REASON");
  }

  await prisma.leadKycDocument.update({
    where: { kycId_docType: { kycId: args.kycId, docType: args.docType } },
    data: {
      status: args.approve ? "APPROVED" : "REJECTED",
      rejectReason: args.approve ? null : args.reason!.trim(),
      reviewedAt: new Date(),
    },
  });

  return settle(args.kycId, args.actorId);
}

/**
 * Rolls the individual verdicts up into one.
 *
 * Everything approved makes the set approved. Anything rejected sends the whole
 * set back, because the applicant needs one clear instruction rather than a
 * partially-passed form they have to diff against last time.
 */
async function settle(kycId: string, actorId: string) {
  const kyc = await prisma.leadKyc.findUnique({
    where: { id: kycId },
    include: { documents: true, application: { select: { email: true, fullName: true } } },
  });
  if (!kyc) throw new AppError(404, "Not found", "NOT_FOUND");

  const required = kyc.documents.filter((d) =>
    REQUIRED_DOCS.some((r) => r.docType === d.docType)
  );
  const allApproved = required.length > 0 && required.every((d) => d.status === "APPROVED");
  const anyRejected = required.some((d) => d.status === "REJECTED");

  const status: LeadKycStatus = allApproved ? "APPROVED" : anyRejected ? "REJECTED" : "SUBMITTED";

  const updated = await prisma.leadKyc.update({
    where: { id: kycId },
    data: {
      status,
      reviewedAt: status === "SUBMITTED" ? null : new Date(),
      reviewedBy: status === "SUBMITTED" ? null : actorId,
    },
  });

  if (status !== "SUBMITTED") {
    await audit({
      action: `lead.kyc_${status.toLowerCase()}`,
      entity: "LeadKyc",
      entityId: kycId,
      actorId,
      metadata: { applicationId: kyc.applicationId },
    });
  }

  // Only tell them when something is wanted from them. An approval is followed
  // by the appointment itself, and two emails a minute apart is noise.
  if (status === "REJECTED") {
    const rejected = required.filter((d) => d.status === "REJECTED");
    await resend.emails
      .send({
        from: MAIL_FROM,
        to: kyc.application.email,
        subject: "One or two documents need another look",
        html: Emails.leadKycRejected({
          fullName: kyc.application.fullName,
          uploadUrl: uploadUrl(updated.token),
          items: rejected.map((d) => ({
            label: REQUIRED_DOCS.find((r) => r.docType === d.docType)?.label ?? d.docType,
            reason: d.rejectReason ?? "Please upload it again.",
          })),
        }),
      })
      .catch((e) => logger.warn(`KYC rejection email failed: ${e.message}`));
  }

  return updated;
}

/**
 * Whether this application may be appointed yet.
 *
 * The gate the whole flow exists for. Called by the appointment service, so
 * "verification is mandatory" is enforced where appointments are made rather
 * than only in the screen that makes them.
 */
export async function assertKycApproved(applicationId: string) {
  const kyc = await prisma.leadKyc.findUnique({ where: { applicationId } });
  if (!kyc) {
    throw new AppError(
      409,
      "Request and verify their documents before appointing them",
      "KYC_NOT_REQUESTED"
    );
  }
  if (kyc.status !== "APPROVED") {
    throw new AppError(
      409,
      `Their documents are ${kyc.status.toLowerCase()} — appoint once verification is approved`,
      "KYC_NOT_APPROVED"
    );
  }
}
