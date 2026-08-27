import sanitizeHtml from "sanitize-html";
import type { AgreementType, Agreement } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { env } from "../../config/env";
import { uploadFile } from "../../lib/storage";
import { htmlToPdf } from "../../lib/pdf";
import { audit } from "../shared/audit.service";
import { logger } from "../../middleware/logger";
import { fiscalYear, nextSequence } from "../../lib/numbering";
import { AGREEMENT_TEMPLATES } from "./agreementTemplates";
import {
  PAGE_MARGIN, bodyStyles, esc, footerTemplate, headerTemplate,
  letterheadLogo, orgDetails,
} from "./letterhead";

/**
 * MOUs and letters issued on DevUp letterhead.
 *
 * The body is authored by a person rather than merged from a record, which
 * means it arrives as HTML pasted out of Word or Google Docs — full of style
 * attributes, comment markers and the occasional script. It is sanitised on the
 * way in and again on the way out, because the copy that reaches Chromium is
 * the one that matters.
 */

/**
 * What an agreement body may contain.
 *
 * An allowlist, not a blocklist: anything unrecognised is dropped rather than
 * escaped. Style attributes go too — pasted content carries Word's own fonts
 * and colours, and letting those through means every MOU looks slightly
 * different from the last.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "h1", "h2", "h3", "h4",
    "strong", "b", "em", "i", "u", "s", "sub", "sup",
    "ul", "ol", "li", "blockquote",
    "table", "thead", "tbody", "tr", "th", "td",
    "a", "span", "div",
  ],
  allowedAttributes: {
    a: ["href", "title"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Word pastes <o:p> and conditional comments; drop them and their contents.
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  transformTags: {
    // Everything deeper than h4 is a heading nobody asked for.
    h5: "h4",
    h6: "h4",
    // Google Docs wraps everything in spans carrying its own fonts.
    span: (_tag, attribs) => ({ tagName: "span", attribs: {} as Record<string, string> }),
    div: "p",
  },
};

export function sanitizeBody(html: string) {
  return sanitizeHtml(html ?? "", SANITIZE_OPTIONS).trim();
}

const fmtDate = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;

/**
 * NumberSequence is keyed by startup, and agreements belong to DevUp itself
 * rather than to a tenant. They are anchored to DevUp's own startup row so the
 * counter behaves exactly like every other numbered document, instead of
 * introducing a nullable foreign key for one caller.
 */
let devupAnchorId: string | null = null;

async function resolveDevupStartupId() {
  if (devupAnchorId) return devupAnchorId;
  const row =
    (await prisma.startup.findFirst({ where: { code: "DIA" }, select: { id: true } })) ??
    (await prisma.startup.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } }));
  if (!row) throw new AppError(500, "No startup row to anchor numbering to", "NO_ANCHOR");
  devupAnchorId = row.id;
  return devupAnchorId;
}

export async function listAgreements() {
  return prisma.agreement.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true, type: true, documentNo: true, title: true, partyName: true,
      status: true, pdfUrl: true, effectiveDate: true, expiryDate: true,
      issuedAt: true, createdAt: true, updatedAt: true,
    },
  });
}

export async function getAgreement(id: string) {
  const a = await prisma.agreement.findUnique({ where: { id } });
  if (!a) throw new AppError(404, "Agreement not found", "NOT_FOUND");
  return a;
}

export interface UpsertInput {
  type: AgreementType;
  title?: string;
  partyName: string;
  partyAddress?: string;
  partySignatory?: string;
  partyTitle?: string;
  partyEmail?: string;
  contentHtml?: string;
  effectiveDate?: string | null;
  expiryDate?: string | null;
  signatoryName?: string;
  signatoryTitle?: string;
}

export async function createAgreement(input: UpsertInput, actorId: string) {
  const tpl = AGREEMENT_TEMPLATES[input.type];
  if (!tpl) throw new AppError(400, "Unknown agreement type", "INVALID_TYPE");

  const created = await prisma.agreement.create({
    data: {
      type: input.type,
      title: input.title?.trim() || tpl.title,
      partyName: input.partyName.trim(),
      partyAddress: input.partyAddress?.trim() || null,
      partySignatory: input.partySignatory?.trim() || null,
      partyTitle: input.partyTitle?.trim() || null,
      partyEmail: input.partyEmail?.trim() || null,
      // Seeded from the template so nobody starts at a blank page.
      contentHtml: sanitizeBody(input.contentHtml ?? tpl.bodyHtml),
      effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      signatoryName: input.signatoryName?.trim() || env.DEVUP_SIGNATORIES[0]?.name,
      signatoryTitle: input.signatoryTitle?.trim() || env.DEVUP_SIGNATORIES[0]?.title,
      createdBy: actorId,
    },
  });

  await audit({
    action: "agreement.created", entity: "Agreement", entityId: created.id,
    actorId, metadata: { type: input.type, party: created.partyName },
  });

  return created;
}

export async function updateAgreement(id: string, input: Partial<UpsertInput>, actorId: string) {
  const existing = await getAgreement(id);
  if (existing.status === "SIGNED") {
    throw new AppError(409, "A signed agreement cannot be edited", "ALREADY_SIGNED");
  }

  const updated = await prisma.agreement.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.partyName !== undefined ? { partyName: input.partyName.trim() } : {}),
      ...(input.partyAddress !== undefined ? { partyAddress: input.partyAddress.trim() || null } : {}),
      ...(input.partySignatory !== undefined ? { partySignatory: input.partySignatory.trim() || null } : {}),
      ...(input.partyTitle !== undefined ? { partyTitle: input.partyTitle.trim() || null } : {}),
      ...(input.partyEmail !== undefined ? { partyEmail: input.partyEmail.trim() || null } : {}),
      ...(input.contentHtml !== undefined ? { contentHtml: sanitizeBody(input.contentHtml) } : {}),
      ...(input.effectiveDate !== undefined
        ? { effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null } : {}),
      ...(input.expiryDate !== undefined
        ? { expiryDate: input.expiryDate ? new Date(input.expiryDate) : null } : {}),
      ...(input.signatoryName !== undefined ? { signatoryName: input.signatoryName.trim() } : {}),
      ...(input.signatoryTitle !== undefined ? { signatoryTitle: input.signatoryTitle.trim() } : {}),
    },
  });

  await audit({
    action: "agreement.updated", entity: "Agreement", entityId: id,
    actorId, metadata: { party: updated.partyName },
  });

  return updated;
}

export async function deleteAgreement(id: string, actorId: string) {
  const a = await getAgreement(id);
  if (a.status !== "DRAFT") {
    throw new AppError(409, "Only a draft can be deleted — cancel it instead", "NOT_A_DRAFT");
  }
  await prisma.agreement.delete({ where: { id } });
  await audit({ action: "agreement.deleted", entity: "Agreement", entityId: id, actorId });
  return { deleted: true };
}

/** The full document as HTML — used for the preview and for the PDF alike. */
export async function renderAgreement(a: Agreement) {
  const org = orgDetails();
  const tpl = AGREEMENT_TEMPLATES[a.type];
  const body = sanitizeBody(a.contentHtml);

  const rows: Array<[string, string | null]> = [
    ["First Party", `${org.legalName}${org.cin ? ` (CIN: ${org.cin})` : ""}`],
    ["Second Party", a.partyName],
    ["Address", a.partyAddress],
    ["Effective Date", fmtDate(a.effectiveDate)],
    ["Valid Until", fmtDate(a.expiryDate)],
  ];

  return `<!doctype html>
<html><head><meta charset="utf-8">
<title>${esc(a.title)}</title>
<style>${bodyStyles()}</style>
</head><body>

  <div class="doc-title">${esc(a.title)}</div>
  ${tpl.subtitle ? `<div class="doc-sub">${esc(tpl.subtitle)}</div>` : ""}

  <div class="meta">
    <div>Ref: <b>${esc(a.documentNo ?? "DRAFT — not yet issued")}</b></div>
    <div>Date: <b>${fmtDate(a.issuedAt ?? new Date())}</b></div>
  </div>

  <div class="parties">
    ${rows
      .filter(([, v]) => Boolean(v))
      .map(([k, v]) => `<div class="row"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`)
      .join("")}
  </div>

  <div class="content">${body}</div>

  <div class="signatures">
    <div class="sig-for">In witness whereof, the Parties have signed this document on the dates below.</div>
    <div class="sig-grid">
      <div class="sig-col">
        <div class="sig-line">
          <div class="sig-role">Authorised Signatory</div>
          <div class="sig-role">${esc(org.legalName)}</div>
          <div class="sig-meta">Date: <span class="sig-fill"></span></div>
        </div>
      </div>
      <div class="sig-col">
        <div class="sig-line">
          <div class="sig-name">${esc(a.partySignatory || " ")}</div>
          <div class="sig-role">${esc(a.partyTitle || "Authorised Signatory")}</div>
          <div class="sig-role">${esc(a.partyName)}</div>
          <div class="sig-meta">Date: <span class="sig-fill"></span></div>
        </div>
      </div>
    </div>
  </div>

</body></html>`;
}

/** PDF with the letterhead repeated on every page. */
export async function renderAgreementPdf(a: Agreement) {
  const org = orgDetails();
  const logo = await letterheadLogo();
  const pdf = await htmlToPdf(await renderAgreement(a), {
    headerHtml: headerTemplate(logo, org),
    footerHtml: footerTemplate(org),
    margin: PAGE_MARGIN,
  });

  if (!pdf) {
    throw new AppError(
      503,
      "PDF rendering is unavailable on this server — install Chrome " +
        "(build step: npx puppeteer browsers install chrome) and try again.",
      "PDF_UNAVAILABLE"
    );
  }
  return pdf;
}

/**
 * Allocate the reference number, render, store.
 *
 * The number is taken only once: reissuing regenerates the file against the
 * same reference, because two pieces of paper bearing different numbers for
 * one agreement is how a dispute starts.
 */
export async function issueAgreement(id: string, actorId: string) {
  const existing = await getAgreement(id);

  const anchor = await resolveDevupStartupId();
  const documentNo =
    existing.documentNo ??
    (await prisma.$transaction(async (tx) => {
      const fy = fiscalYear();
      const abbr = AGREEMENT_TEMPLATES[existing.type].abbr;
      const n = await nextSequence(tx, anchor, `DOC_AGREEMENT_${abbr}` as never, fy);
      return `DEVUP/${abbr}/${fy}/${String(n).padStart(4, "0")}`;
    }));

  const withNumber = await prisma.agreement.update({
    where: { id },
    data: {
      documentNo,
      issuedAt: existing.issuedAt ?? new Date(),
      status: existing.status === "DRAFT" ? "ISSUED" : existing.status,
    },
  });

  const pdf = await renderAgreementPdf(withNumber);
  let pdfUrl: string | null = null;
  try {
    pdfUrl = await uploadFile(
      env.STORAGE_BUCKET_DOCUMENTS,
      `agreements/${withNumber.id}.pdf`,
      pdf,
      "application/pdf"
    );
    await prisma.agreement.update({ where: { id }, data: { pdfUrl } });
  } catch (err) {
    // The record and its number stand even if storage hiccups; the file can be
    // rebuilt from the same content without taking a second number.
    logger.warn(`agreement upload failed for ${documentNo}: ${(err as Error).message}`);
  }

  await audit({
    action: "agreement.issued", entity: "Agreement", entityId: id,
    actorId, metadata: { documentNo, party: withNumber.partyName },
  });

  return { ...withNumber, pdfUrl };
}

export async function setStatus(id: string, status: "SIGNED" | "CANCELLED", actorId: string) {
  const a = await getAgreement(id);
  if (!a.documentNo) {
    throw new AppError(409, "Issue the agreement before marking it signed", "NOT_ISSUED");
  }
  const updated = await prisma.agreement.update({ where: { id }, data: { status } });
  await audit({
    action: `agreement.${status.toLowerCase()}`, entity: "Agreement", entityId: id,
    actorId, metadata: { documentNo: a.documentNo },
  });
  return updated;
}
