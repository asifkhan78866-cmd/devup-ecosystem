import { LeadershipRole, LeadAppointmentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { env } from "../../config/env";
import { fiscalYear, nextSequence } from "../../lib/numbering";
import { htmlToPdf } from "../../lib/pdf";
import { uploadFile } from "../../lib/storage";
import { logger } from "../../middleware/logger";
import { letterheadLogo, orgDetails } from "../legal/letterhead";
import { notify } from "../shared/notification.service";
import { audit, AuditAction } from "../shared/audit.service";
import { Emails } from "../../lib/email/templates";
import { TIERS, renderDeed, AppointmentPayload } from "./appointmentTemplates";
import { renderCertificate } from "./certificate.template";
import { renderHandbook } from "./handbook.template";
import { loadStamps } from "./stamps";

/**
 * Issuing deeds of appointment for the Lead DevUp directorate.
 *
 * Deliberately parallel to the agreement flow rather than to HrDocument: these
 * appointments are made by DevUp itself over a territory, not by a member
 * startup over an employee, so there is no tenant branding to resolve and no
 * employment record to attach to.
 */

let devupAnchorId: string | null = null;

/**
 * NumberSequence is keyed per startup, so ecosystem-level numbering is anchored
 * to DevUp's own row. Same anchor the agreements use, so both series come from
 * one place if that row is ever renamed.
 */
async function resolveAnchor() {
  if (devupAnchorId) return devupAnchorId;
  const row =
    (await prisma.startup.findFirst({ where: { code: "DIA" }, select: { id: true } })) ??
    (await prisma.startup.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } }));
  if (!row) throw new AppError(500, "No startup row to anchor numbering to", "NO_ANCHOR");
  devupAnchorId = row.id;
  return devupAnchorId;
}

/** DEVUP/LEAD/SD/2026-27/0001 — its own run per tier, reset each fiscal year. */
async function nextInstrumentNo(role: LeadershipRole) {
  const anchor = await resolveAnchor();
  const abbr = TIERS[role].abbr;
  return prisma.$transaction(async (tx) => {
    const fy = fiscalYear();
    const n = await nextSequence(tx, anchor, `DOC_LEAD_${abbr}` as never, fy);
    return `DEVUP/LEAD/${abbr}/${fy}/${String(n).padStart(4, "0")}`;
  });
}

/**
 * The territory the deed names.
 *
 * Each tier holds a different unit, and the narrowest recorded field is the
 * right one — a Campus Director is appointed over their college, not over the
 * state it happens to sit in.
 */
export function defaultJurisdiction(
  role: LeadershipRole,
  src: { state?: string | null; city?: string | null; college?: string | null }
) {
  const state = src.state?.trim() || "";
  const city = src.city?.trim() || "";
  const college = src.college?.trim() || "";
  switch (role) {
    case "CAMPUS_DIRECTOR":
      return college || city || state;
    case "CITY_DIRECTOR":
      return city || state;
    case "REGIONAL_DIRECTOR":
      return city ? `${city} Region` : state;
    case "STATE_DIRECTOR":
    default:
      return state;
  }
}

function addMonths(from: Date, months: number) {
  const d = new Date(from);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // A 31st rolling into a short month lands in the following one; pull it back
  // so a 12-month term never quietly becomes 12 months and a day.
  if (d.getDate() < day) d.setDate(0);
  return d;
}

export interface IssueInput {
  /** Either an application to appoint from… */
  applicationId?: string;
  /** …or the particulars typed in directly, for an appointment made off-intake. */
  role?: LeadershipRole;
  fullName?: string;
  email?: string;
  phone?: string;
  state?: string;
  city?: string;
  college?: string;
  /** Overrides the territory derived from the tier. */
  jurisdiction?: string;
  termMonths?: number;
  effectiveFrom?: string;
  actorId: string;
  /** Issue a second deed even though a live one exists — e.g. a name correction. */
  force?: boolean;
}

export async function listAppointments(filters?: { role?: LeadershipRole; status?: LeadAppointmentStatus }) {
  return prisma.leadAppointment.findMany({
    where: {
      ...(filters?.role ? { role: filters.role } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    },
    orderBy: { issuedAt: "desc" },
    select: {
      id: true, documentNo: true, role: true, fullName: true, email: true,
      jurisdiction: true, state: true, city: true, college: true,
      effectiveFrom: true, effectiveTo: true, termMonths: true,
      status: true, pdfUrl: true, certificateUrl: true, handbookUrl: true,
      issuedAt: true, revokedAt: true,
      revokeReason: true, applicationId: true,
    },
  });
}

export async function getAppointment(id: string) {
  const row = await prisma.leadAppointment.findUnique({ where: { id } });
  if (!row) throw new AppError(404, "Appointment not found", "NOT_FOUND");
  return row;
}

/** Selected applicants who do not yet hold a live deed. */
export async function pendingSelections() {
  const selected = await prisma.leadApplication.findMany({
    where: { status: "SELECTED" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, applicationNo: true, role: true, fullName: true, email: true,
      phone: true, state: true, city: true, college: true, updatedAt: true,
      appointments: {
        where: { status: "ISSUED" },
        select: { id: true, documentNo: true, pdfUrl: true, issuedAt: true },
      },
    },
  });
  return selected.map((a) => ({
    ...a,
    appointment: a.appointments[0] ?? null,
    appointments: undefined,
    suggestedJurisdiction: defaultJurisdiction(a.role, a),
  }));
}

async function buildPayload(row: {
  role: LeadershipRole; fullName: string; email: string; phone: string | null;
  state: string; city: string | null; college: string | null; jurisdiction: string;
  documentNo: string; effectiveFrom: Date; effectiveTo: Date; termMonths: number; issuedAt: Date;
}): Promise<AppointmentPayload> {
  return {
    ...row,
    logo: await letterheadLogo(),
    org: orgDetails(),
    stamps: await loadStamps(),
    // Frozen onto the deed: a later change of office must not alter an
    // instrument that has already been signed.
    directors: env.DEVUP_SIGNATORIES.map((d) => ({ name: d.name, title: d.title })),
  };
}

/**
 * The three documents an appointment produces.
 *
 * The certificate is what gets shown; the deed is what binds; the handbook is
 * what the person actually needs on Monday. They are generated together and
 * sent together, because an appointment that arrives as one of the three
 * always turns into a question about the other two.
 */
export const DOCUMENT_KINDS = ["certificate", "deed", "handbook"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

const RENDERERS: Record<DocumentKind, (p: AppointmentPayload) => string> = {
  certificate: renderCertificate,
  deed: renderDeed,
  handbook: renderHandbook,
};

const URL_COLUMN: Record<DocumentKind, "certificateUrl" | "pdfUrl" | "handbookUrl"> = {
  certificate: "certificateUrl",
  // The deed keeps the original column so links already sent still resolve.
  deed: "pdfUrl",
  handbook: "handbookUrl",
};

const FILE_LABEL: Record<DocumentKind, string> = {
  certificate: "Certificate-of-Appointment",
  deed: "Deed-of-Appointment",
  handbook: "Directorate-Handbook",
};

export async function renderAppointment(id: string, kind: DocumentKind = "deed") {
  const a = await getAppointment(id);
  return RENDERERS[kind](await payloadFor(a));
}

/**
 * Re-renders from the payload frozen at issue where there is one, so a preview
 * of an old appointment shows what was actually sent rather than what today's
 * configuration would produce.
 */
async function payloadFor(a: { payload: Prisma.JsonValue }): Promise<AppointmentPayload> {
  const stored = a.payload as Prisma.JsonObject | null;
  if (stored && typeof stored === "object" && "org" in stored) {
    const p = stored as unknown as AppointmentPayload;
    return {
      ...p,
      effectiveFrom: new Date(p.effectiveFrom),
      effectiveTo: new Date(p.effectiveTo),
      issuedAt: new Date(p.issuedAt),
      // Images are held out of the row — a few hundred KB of data URI per
      // appointment is not something a database column should carry.
      logo: await letterheadLogo(),
      stamps: await loadStamps(),
    };
  }
  return buildPayload(a as never);
}

export async function renderAppointmentPdf(id: string, kind: DocumentKind = "deed") {
  const html = await renderAppointment(id, kind);
  const pdf = await htmlToPdf(html, {});
  if (!pdf) throw new AppError(503, "PDF rendering is unavailable on this deployment", "PDF_UNAVAILABLE");
  return pdf;
}

/**
 * Renders, stores and links all three documents.
 *
 * Never throws: the instrument number is already allocated and the row already
 * exists, so a Chromium or storage failure has to degrade to "no file yet"
 * rather than losing the appointment. Each document is independent — a
 * handbook that fails to render must not cost the appointee their certificate.
 */
async function attachFiles(id: string, documentNo: string, payload: AppointmentPayload) {
  const buffers: Partial<Record<DocumentKind, Buffer>> = {};
  const urls: Partial<Record<"certificateUrl" | "pdfUrl" | "handbookUrl", string>> = {};

  for (const kind of DOCUMENT_KINDS) {
    try {
      const pdf = await htmlToPdf(RENDERERS[kind](payload), {});
      if (!pdf) continue;
      buffers[kind] = pdf;
      urls[URL_COLUMN[kind]] = await uploadFile(
        env.STORAGE_BUCKET_DOCUMENTS,
        `lead-appointments/${id}-${kind}.pdf`,
        pdf,
        "application/pdf"
      );
    } catch (err) {
      logger.warn(`lead ${kind} failed for ${documentNo}: ${(err as Error).message}`);
    }
  }

  if (Object.keys(urls).length) {
    await prisma.leadAppointment
      .update({ where: { id }, data: urls })
      .catch((err) => logger.warn(`could not link files to ${documentNo}: ${err.message}`));
  }
  return { buffers, urls };
}

/** The appointment email, with all three documents attached. */
async function sendDeed(
  a: {
    id: string; documentNo: string; role: LeadershipRole; fullName: string;
    email: string; jurisdiction: string; effectiveFrom: Date; effectiveTo: Date;
  },
  buffers: Partial<Record<DocumentKind, Buffer>>
) {
  const tier = TIERS[a.role];
  const user = await prisma.user.findUnique({ where: { email: a.email }, select: { id: true } });
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  // Instrument numbers are slash-separated, which no mail client will accept
  // in a filename.
  const ref = a.documentNo.split("/").join("-");

  const attachments = DOCUMENT_KINDS.filter((k) => buffers[k]).map((k) => ({
    filename: `${FILE_LABEL[k]}-${ref}.pdf`,
    content: buffers[k] as Buffer,
  }));

  await notify({
    userId: user?.id,
    email: a.email,
    event: "SELECTED",
    title: `You are appointed ${tier.label} — ${a.jurisdiction}`,
    message: `Your appointment (${a.documentNo}) has been issued. Three documents are attached.`,
    link: "/lead-devup",
    html: Emails.generic({
      title: `Your appointment as ${tier.label}`,
      message:
        `Hi ${a.fullName},

` +
        `It is our pleasure to appoint you ${tier.label} for ${a.jurisdiction} under the Lead DevUp ` +
        `programme. The appointment runs from ${fmt(a.effectiveFrom)} to ${fmt(a.effectiveTo)} under ` +
        `instrument ${a.documentNo}.

` +
        `Three documents are attached.

` +
        `1. Certificate of Appointment — sealed and signed. This is yours to keep and to share.
` +
        `2. Deed of Appointment — the terms of the office. Read it in full, sign where indicated, ` +
        `and keep a copy; you will be asked for it.
` +
        `3. Directorate Handbook — how the office actually works: your first thirty days, the weekly ` +
        `rhythm, what to report and to whom, and what a good quarter looks like. Read this one first.

` +
        `Welcome to the directorate.`,
      link: "/lead-devup",
    }),
    attachments: attachments.length ? attachments : undefined,
  });
}

export async function issueAppointment(input: IssueInput) {
  let src: {
    role: LeadershipRole; fullName: string; email: string; phone: string | null;
    state: string; city: string | null; college: string | null; applicationId: string | null;
  };

  if (input.applicationId) {
    const app = await prisma.leadApplication.findUnique({ where: { id: input.applicationId } });
    if (!app) throw new AppError(404, "Application not found", "NOT_FOUND");
    if (app.status !== "SELECTED") {
      throw new AppError(
        409,
        "Mark the application Selected before issuing a deed of appointment",
        "NOT_SELECTED"
      );
    }
    src = {
      role: app.role, fullName: app.fullName, email: app.email, phone: app.phone,
      state: app.state, city: app.city, college: app.college, applicationId: app.id,
    };
  } else {
    if (!input.role || !input.fullName?.trim() || !input.email?.trim() || !input.state?.trim()) {
      throw new AppError(400, "Role, name, email and state are required", "INCOMPLETE");
    }
    src = {
      role: input.role, fullName: input.fullName.trim(), email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null, state: input.state.trim(),
      city: input.city?.trim() || null, college: input.college?.trim() || null,
      applicationId: null,
    };
  }

  // One live deed per person per office. Without this, a repeated bulk run
  // burns a fresh instrument number for everyone every time it is pressed.
  const existing = await prisma.leadAppointment.findFirst({
    where: { email: src.email, role: src.role, status: "ISSUED" },
  });
  if (existing && !input.force) {
    return { appointment: existing, created: false };
  }

  const jurisdiction = input.jurisdiction?.trim() || defaultJurisdiction(src.role, src);
  if (!jurisdiction) {
    throw new AppError(400, "This appointment needs a territory", "NO_JURISDICTION");
  }

  const termMonths = input.termMonths && input.termMonths > 0 ? Math.floor(input.termMonths) : 12;
  const effectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : new Date();
  if (Number.isNaN(effectiveFrom.getTime())) {
    throw new AppError(400, "Effective date is not a valid date", "BAD_DATE");
  }
  const effectiveTo = addMonths(effectiveFrom, termMonths);
  const issuedAt = new Date();
  const documentNo = await nextInstrumentNo(src.role);

  const payload = await buildPayload({
    role: src.role, fullName: src.fullName, email: src.email, phone: src.phone,
    state: src.state, city: src.city, college: src.college, jurisdiction,
    documentNo, effectiveFrom, effectiveTo, termMonths, issuedAt,
  });

  const appointment = await prisma.leadAppointment.create({
    data: {
      documentNo, applicationId: src.applicationId, role: src.role,
      fullName: src.fullName, email: src.email, phone: src.phone,
      jurisdiction, state: src.state, city: src.city, college: src.college,
      termMonths, effectiveFrom, effectiveTo, issuedAt,
      issuedBy: input.actorId,
      // The crest is stripped before freezing: a 96KB data URI in every row
      // would bloat the table for something that is regenerated on read anyway.
      payload: { ...payload, logo: null } as unknown as Prisma.InputJsonValue,
    },
  });

  await audit({
    action: AuditAction.DOCUMENT_ISSUED,
    entity: "LeadAppointment",
    entityId: appointment.id,
    actorId: input.actorId,
    metadata: { documentNo, role: src.role, jurisdiction },
  });

  const files = await attachFiles(appointment.id, documentNo, payload);
  await sendDeed({ ...appointment }, files.buffers);

  return {
    appointment: { ...appointment, ...files.urls },
    created: true,
    documents: DOCUMENT_KINDS.filter((k) => files.buffers[k]),
    // True only when all three rendered: a partial set is worth telling the
    // admin about, since the fix is to press Regenerate.
    pdfGenerated: DOCUMENT_KINDS.every((k) => Boolean(files.buffers[k])),
  };
}

/** Issues for every selected applicant who does not hold a live deed. */
export async function issueForAllSelected(actorId: string) {
  const pending = await pendingSelections();
  const todo = pending.filter((p) => !p.appointment);
  const results: Array<{ applicationId: string; fullName: string; ok: boolean; documentNo?: string; error?: string }> = [];

  for (const p of todo) {
    try {
      const r = await issueAppointment({ applicationId: p.id, actorId });
      results.push({ applicationId: p.id, fullName: p.fullName, ok: true, documentNo: r.appointment.documentNo });
    } catch (err) {
      // One bad row must not abandon the rest of the batch half-issued.
      const message = err instanceof AppError ? err.message : (err as Error).message;
      logger.error(`lead appointment failed for ${p.email}: ${message}`);
      results.push({ applicationId: p.id, fullName: p.fullName, ok: false, error: message });
    }
  }
  return { issued: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results };
}

/** Re-renders and re-sends. Used when the first attempt had no Chromium. */
export async function resendAppointment(id: string) {
  const a = await getAppointment(id);
  if (a.status === "REVOKED") {
    throw new AppError(409, "This appointment has been revoked", "REVOKED");
  }
  const files = await attachFiles(a.id, a.documentNo, await payloadFor(a));
  await sendDeed(a, files.buffers);
  return {
    ...files.urls,
    documents: DOCUMENT_KINDS.filter((k) => files.buffers[k]),
    pdfGenerated: DOCUMENT_KINDS.every((k) => Boolean(files.buffers[k])),
  };
}

export async function revokeAppointment(id: string, reason: string, actorId: string) {
  const a = await getAppointment(id);
  if (a.status === "REVOKED") return a;
  if (!reason?.trim()) throw new AppError(400, "A revocation needs a reason", "NO_REASON");

  const updated = await prisma.leadAppointment.update({
    where: { id },
    data: { status: "REVOKED", revokedAt: new Date(), revokeReason: reason.trim() },
  });

  await audit({
    action: AuditAction.DOCUMENT_REVOKED,
    entity: "LeadAppointment",
    entityId: id,
    actorId,
    metadata: { documentNo: a.documentNo, reason: reason.trim() },
  });

  // The holder is told. An office withdrawn silently is how someone keeps
  // introducing themselves with a title they no longer hold.
  const user = await prisma.user.findUnique({ where: { email: a.email }, select: { id: true } });
  await notify({
    userId: user?.id,
    email: a.email,
    event: "SELECTED",
    title: `Your appointment as ${TIERS[a.role].label} has ended`,
    message: `Instrument ${a.documentNo} has been revoked.`,
    html: Emails.generic({
      title: "Your Lead DevUp appointment has ended",
      message:
        `Hi ${a.fullName},\n\n` +
        `Your appointment as ${TIERS[a.role].label} for ${a.jurisdiction}, instrument ` +
        `${a.documentNo}, has been revoked with effect from today.\n\n` +
        `Reason: ${reason.trim()}\n\n` +
        `Please stop using the designation and the Company's name and materials, as provided in ` +
        `the deed. Thank you for your service to the ecosystem.`,
    }),
  });

  return updated;
}

/** The tiers, for the admin picker. */
export function tiers() {
  return (Object.keys(TIERS) as LeadershipRole[]).map((role) => ({
    role,
    label: TIERS[role].label,
    abbr: TIERS[role].abbr,
    rank: TIERS[role].rank,
    accent: TIERS[role].accent,
    motto: TIERS[role].motto,
    reporting: TIERS[role].reporting,
    duties: TIERS[role].duties,
  }));
}
