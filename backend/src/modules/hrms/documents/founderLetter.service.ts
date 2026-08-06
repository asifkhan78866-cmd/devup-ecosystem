import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { fiscalYear, nextSequence } from "../../../lib/numbering";
import { notify } from "../../shared/notification.service";
import { Emails } from "../../../lib/email/templates";
import * as documents from "./document.service";

/**
 * Founder appointment letters.
 *
 * Founders hold a StartupMember row and nothing else — no Employee record,
 * because they are not on the payroll — so the document attaches to the
 * membership. Everything else (numbering, branding, freezing, PDF, delivery)
 * goes through the same generator as every other document.
 */

/** DEVUP/ZAP/FAL/2026-27/0001 — resets every fiscal year, like offers. */
async function nextFounderLetterNo(tx: any, startupId: string, code: string) {
  const fy = fiscalYear();
  const n = await nextSequence(tx, startupId, "DOC_FOUNDER_LETTER", fy);
  return `DEVUP/${code}/FAL/${fy}/${String(n).padStart(4, "0")}`;
}

export interface IssueFounderLetterInput {
  startupId: string;
  startupCode: string;
  memberId: string;
  /** Overrides the title on the letter. Defaults to their membership role. */
  designation?: string;
  body?: string;
  actorId: string;
  /** Reissue even though one already exists, e.g. after a name correction. */
  force?: boolean;
}

export async function issueFounderLetter(input: IssueFounderLetterInput) {
  const member = await prisma.startupMember.findFirst({
    where: { id: input.memberId, startupId: input.startupId },
    include: {
      user: { select: { id: true, email: true, profile: { select: { name: true } } } },
    },
  });
  if (!member) throw new AppError(404, "Member not found", "NOT_FOUND");
  if (member.status !== "ACTIVE") {
    throw new AppError(409, "This member has not accepted their invitation yet", "MEMBER_NOT_ACTIVE");
  }

  // One letter per founder unless deliberately reissued — otherwise a repeated
  // bulk run would burn a new number for everyone every time.
  const existing = await prisma.hrDocument.findFirst({
    where: { memberId: member.id, docType: "FOUNDER_LETTER", revokedAt: null },
  });
  if (existing && !input.force) {
    return { document: existing, created: false, pdfUrl: existing.pdfUrl };
  }

  // Fails loudly when branding is unset rather than issuing an unbranded letter.
  await documents.getBranding(input.startupId);

  const fullName = member.user?.profile?.name?.trim() || member.email.split("@")[0];

  const result = await prisma.$transaction(async (tx) => {
    const documentNo = await nextFounderLetterNo(tx, input.startupId, input.startupCode);
    const doc = await documents.issue(
      {
        startupId: input.startupId,
        docType: "FOUNDER_LETTER",
        documentNo,
        templateKey: "FOUNDER_LETTER",
        memberId: member.id,
        issuedBy: input.actorId,
        payload: {
          fullName,
          // Their recorded title wins over the permission role: a COO holds
          // FOUNDER-level access but is not a founder.
          designation: input.designation ?? member.title ?? titleFor(member.role),
          // joinedAt is when they accepted; invitedAt is the earliest date we
          // can stand behind if that was never recorded.
          since: member.joinedAt ?? member.invitedAt,
          body: input.body,
        },
      },
      tx
    );
    return doc;
  });

  // Render and upload outside the transaction — Chromium far exceeds its budget.
  const file = await documents.attachFile(result, result.html);

  await notify({
    userId: member.userId ?? undefined,
    email: member.email,
    event: "SELECTED",
    title: `Your founder letter — ${result.documentNo}`,
    message: `Your founder appointment letter has been issued. It is also available on your dashboard.`,
    link: "/dashboard/internship",
    html: Emails.generic({
      title: "Your founder appointment letter",
      message:
        `Hi ${fullName},\n\nYour founder appointment letter (${result.documentNo}) is attached, ` +
        `and you can download it any time from your DevUp dashboard.`,
      link: "/dashboard/internship",
    }),
    attachments: file.pdfBuffer
      ? [{ filename: `Founder-Letter-${result.documentNo.replace(/\//g, "-")}.pdf`, content: file.pdfBuffer }]
      : undefined,
  });

  return { document: result, created: true, pdfUrl: file.pdfUrl, pdfGenerated: file.pdfGenerated };
}

function titleFor(role: string) {
  return role === "OWNER" ? "Founder" : role.charAt(0) + role.slice(1).toLowerCase();
}

/**
 * Every founder across the whole ecosystem, with the state of their letter.
 *
 * Founders belong to individual startups but are managed from DevUp: this is
 * the one screen where you can see who has a letter and who is still waiting,
 * without opening five workspaces.
 */
export async function listAllFounders() {
  const members = await prisma.startupMember.findMany({
    where: { role: { in: ["FOUNDER", "OWNER"] } },
    select: {
      id: true, email: true, role: true, title: true, status: true, joinedAt: true,
      user: { select: { profile: { select: { name: true } } } },
      startup: {
        select: { id: true, code: true, name: true, type: true, logoUrl: true, branding: { select: { id: true } } },
      },
      documents: {
        where: { docType: "FOUNDER_LETTER", revokedAt: null },
        select: { id: true, documentNo: true, pdfUrl: true, issuedAt: true },
        take: 1,
      },
    },
    orderBy: [{ startup: { name: "asc" } }, { createdAt: "asc" }],
  });

  return members.map((m) => {
    const letter = m.documents[0] ?? null;
    // Say exactly why someone cannot be sent one, rather than leaving the
    // button disabled with no explanation.
    const blocked = !m.startup.code
      ? "This startup has no tenant code"
      : !m.startup.branding
        ? "Branding not configured for this startup"
        : m.status !== "ACTIVE"
          ? "Invitation not accepted yet"
          : null;

    return {
      id: m.id,
      name: m.user?.profile?.name ?? null,
      email: m.email,
      role: m.role,
      title: m.title,
      status: m.status,
      joinedAt: m.joinedAt,
      startup: {
        id: m.startup.id,
        code: m.startup.code,
        name: m.startup.name,
        type: m.startup.type,
        logoUrl: m.startup.logoUrl,
      },
      letter,
      canIssue: !blocked && !letter,
      blocked,
    };
  });
}

/** Issue to a founder from the platform admin, resolving their startup for them. */
export async function issueFromPlatform(memberId: string, actorId: string, force = false) {
  const member = await prisma.startupMember.findUnique({
    where: { id: memberId },
    select: { startupId: true, startup: { select: { code: true } } },
  });
  if (!member) throw new AppError(404, "Member not found", "NOT_FOUND");
  if (!member.startup.code) {
    throw new AppError(409, "This startup has no tenant code", "NO_STARTUP_CODE");
  }

  return issueFounderLetter({
    startupId: member.startupId,
    startupCode: member.startup.code,
    memberId,
    actorId,
    force,
  });
}

/** Bulk issue across every startup. Reports each skip with its reason. */
export async function issueForSelected(memberIds: string[], actorId: string) {
  const issued: Array<{ email: string; documentNo: string }> = [];
  const skipped: Array<{ email: string; reason: string }> = [];

  for (const id of memberIds) {
    const m = await prisma.startupMember.findUnique({ where: { id }, select: { email: true } });
    const email = m?.email ?? id;
    try {
      const r = await issueFromPlatform(id, actorId);
      if (r.created) issued.push({ email, documentNo: r.document.documentNo });
      else skipped.push({ email, reason: "already has a letter" });
    } catch (err) {
      skipped.push({ email, reason: (err as Error).message });
    }
  }

  return { issued: issued.length, issuedTo: issued, skipped };
}

/**
 * Issue to every active founder of one startup.
 *
 * Reports what it skipped and why rather than failing the whole run — one
 * startup missing branding should not stop the others.
 */
export async function issueForAllFounders(args: {
  startupId: string;
  startupCode: string;
  actorId: string;
}) {
  const founders = await prisma.startupMember.findMany({
    where: { startupId: args.startupId, role: { in: ["FOUNDER", "OWNER"] }, status: "ACTIVE" },
    select: { id: true, email: true },
  });

  const issued: string[] = [];
  const skipped: Array<{ email: string; reason: string }> = [];

  for (const f of founders) {
    try {
      const r = await issueFounderLetter({ ...args, memberId: f.id });
      if (r.created) issued.push(f.email);
      else skipped.push({ email: f.email, reason: "already has a letter" });
    } catch (err) {
      skipped.push({ email: f.email, reason: (err as Error).message });
    }
  }

  return { issued: issued.length, issuedTo: issued, skipped };
}
