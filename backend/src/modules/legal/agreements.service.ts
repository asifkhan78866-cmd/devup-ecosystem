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
  PAGE_MARGIN, PAGE_NUMBER_SCRIPT, bodyStyles, esc, footerTemplate, headerTemplate, letterheadLogo, orgDetails, pageChromeCss,
} from "./letterhead";
import { loadStamps } from "../lead-applications/stamps";
import { resend, MAIL_FROM } from "../../lib/resend";
import { Emails } from "../../lib/email/templates";

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
    span: (_tag: string, attribs: Record<string, string>) => ({ tagName: "span", attribs: {} as Record<string, string> }),
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
      partyEmail: true, sentAt: true, sentTo: true, sentCount: true,
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
  partySignOrg?: string;
  extraSignatories?: ExtraSignatory[];
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

  /**
   * A signed agreement's wording is frozen, but its delivery details are not.
   *
   * The recipient address never appears in the document — the rendered parties
   * block carries the name and postal address only — so changing it alters
   * nothing that was agreed. Locking it along with everything else made a
   * signed document impossible to send: the panel asked for an address and the
   * save that would have set it returned 409.
   */
  if (existing.status === "SIGNED") {
    const touched = Object.keys(input).filter(
      (k) => input[k as keyof UpsertInput] !== undefined && k !== "partyEmail"
    );
    if (touched.length > 0) {
      throw new AppError(409, "A signed agreement cannot be edited", "ALREADY_SIGNED");
    }
  }

  const updated = await prisma.agreement.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.partyName !== undefined ? { partyName: input.partyName.trim() } : {}),
      ...(input.partyAddress !== undefined ? { partyAddress: input.partyAddress.trim() || null } : {}),
      ...(input.partySignatory !== undefined ? { partySignatory: input.partySignatory.trim() || null } : {}),
      ...(input.partyTitle !== undefined ? { partyTitle: input.partyTitle.trim() || null } : {}),
      ...(input.partySignOrg !== undefined ? { partySignOrg: input.partySignOrg.trim() || null } : {}),
      ...(input.extraSignatories !== undefined
        ? { extraSignatories: (input.extraSignatories ?? []) as never }
        : {}),
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
export interface ExtraSignatory {
  name?: string;
  title: string;
  org?: string;
}

/**
 * Further signature blocks beyond the two principals.
 *
 * Kept to three in total across the row: a fourth column leaves each rule too
 * short to sign on at A4, which defeats the point of printing it.
 */
function extraSignatureColumns(raw: unknown) {
  const list = Array.isArray(raw) ? (raw as ExtraSignatory[]) : [];
  return list
    .filter((x) => x && String(x.title ?? "").trim())
    .slice(0, 1)
    .map(
      (x) => `<div class="sig-col stamped">
        <div class="sig-line">
          <div class="sig-name">${esc(x.name || " ")}</div>
          <div class="sig-role">${esc(x.title)}</div>
          ${x.org ? `<div class="sig-role">${esc(x.org)}</div>` : ""}
          <div class="sig-meta">Date: <span class="sig-fill"></span></div>
        </div>
      </div>`
    )
    .join("");
}

export async function renderAgreement(a: Agreement) {
  const org = orgDetails();
  const tpl = AGREEMENT_TEMPLATES[a.type];
  const body = sanitizeBody(a.contentHtml);

  /**
   * A letter is not an agreement, and is not laid out like one.
   *
   * No parties table and no counter-signature: there is no second party to a
   * letter of invitation, and printing an empty rule for one to sign invites
   * the question of who was meant to.
   */
  const isLetter = a.type === "LETTER";

  const rows: Array<[string, string | null]> = isLetter
    ? [["Date", fmtDate(a.issuedAt ?? new Date())]]
    : [
        ["First Party", `${org.legalName}${org.cin ? ` (CIN: ${org.cin})` : ""}`],
        ["Second Party", a.partyName],
        ["Address", a.partyAddress],
        ["Effective Date", fmtDate(a.effectiveDate)],
        ["Valid Until", fmtDate(a.expiryDate)],
      ];

  const logo = await letterheadLogo();
  const stamps = await loadStamps();

  const head = headerTemplate(logo, org);
  const foot = footerTemplate(org);

  return `<!doctype html>
<html><head><meta charset="utf-8">
<title>${esc(a.title)}</title>
<style>
${bodyStyles()}
${pageChromeCss()}

  /* Signatures sit in a fixed two-column grid aligned at the top, so both
     rules land on the same line. Aligned at the bottom they drifted apart the
     moment one side carried an extra line of text. */
  .sig-grid { display: flex; align-items: flex-start; gap: 14mm; }
  .sig-col { flex: 1; min-width: 0; position: relative; }
  /* The column reserves the height the marks need, and they are positioned
     from its top so they land on the rule. Anchored with bottom:100% they sat
     above the column entirely and printed across the witness line. */
  .sig-col.stamped { padding-top: 28mm; }
  .sig-stamp { position: absolute; left: 1mm; top: 4mm; width: 44mm; height: auto;
               transform: rotate(-3.5deg); opacity: 0.94; }
  /* Below the rule, in the flow.
     Both marks used to be absolutely positioned in the same band above the
     line, and they collided — the seal printed straight through the signature
     stamp. In the flow it cannot overlap anything, whatever the column width
     turns out to be once a third signatory is added. */
  .seal-mark { display: block; width: 24mm; height: auto; margin: 3.5mm 0 0;
               opacity: 0.9; }
</style>
</head><body>

<template id="chrome-tpl">
  <div class="lh-head">${head}</div>
  <div class="lh-foot">${foot}</div>
</template>

<div id="pages"></div>
<div id="flow">

  ${a.title?.trim() ? `<div class="flow-item doc-title">${esc(a.title)}</div>` : ""}
  ${tpl.subtitle ? `<div class="flow-item doc-sub">${esc(tpl.subtitle)}</div>` : ""}

  <div class="flow-item meta">
    <div>Ref: <b>${esc(a.documentNo ?? "DRAFT — not yet issued")}</b></div>
    <div>Date: <b>${fmtDate(a.issuedAt ?? new Date())}</b></div>
  </div>

  <div class="flow-item parties" style="${isLetter ? "display:none" : ""}">
    ${rows
      .filter(([, v]) => Boolean(v))
      .map(([k, v]) => `<div class="row"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`)
      .join("")}
  </div>

  <div class="flow-item content" data-split>${body}</div>

  <div class="flow-item signatures">
    ${isLetter
      ? ""
      : `<div class="sig-for">In witness whereof, the Parties have signed this document on the dates below.</div>`}
    <div class="sig-grid">
      <div class="sig-col stamped">
        ${stamps.authorisedSign ? `<img class="sig-stamp" src="${stamps.authorisedSign}" alt="">` : ""}
        <div class="sig-line">
          <div class="sig-role">Authorised Signatory</div>
          <div class="sig-role">${esc(org.legalName)}</div>
          <div class="sig-meta">Date: <span class="sig-fill"></span></div>
          ${stamps.officialSeal ? `<img class="seal-mark" src="${stamps.officialSeal}" alt="Common Seal">` : ""}
        </div>
      </div>
      ${isLetter
        ? ""
        : `<div class="sig-col stamped">
        <div class="sig-line">
          <div class="sig-name">${esc(a.partySignatory || " ")}</div>
          <div class="sig-role">${esc(a.partyTitle || "Authorised Signatory")}</div>
          <div class="sig-role">${esc(a.partySignOrg || a.partyName)}</div>
          <div class="sig-meta">Date: <span class="sig-fill"></span></div>
        </div>
      </div>`}
      ${extraSignatureColumns(a.extraSignatories)}
    </div>
  </div>

</div>

<script>
/**
 * Lays the document into A4 pages, each carrying its own letterhead.
 *
 * Runs in the browser for the preview and inside Chromium for the PDF, so the
 * two are the same document rather than two renderings that happen to agree.
 */
(function () {
  var flow = document.getElementById('flow');
  var host = document.getElementById('pages');
  var tpl = document.getElementById('chrome-tpl');
  if (!flow || !host || !tpl) return;

  function newPage() {
    var page = document.createElement('div');
    page.className = 'page';
    page.appendChild(tpl.content.cloneNode(true));
    var sheet = document.createElement('div');
    sheet.className = 'sheet';
    page.appendChild(sheet);
    host.appendChild(page);
    return sheet;
  }

  /**
   * Flatten the authored body into its own top-level blocks first.
   *
   * Left whole it is a single node, so a letter longer than a page has nowhere
   * to break and runs off the bottom. Done here on the parsed DOM rather than
   * by pattern-matching the HTML upstream, because a regex over markup drops
   * whatever it fails to match — and losing a clause out of an agreement is not
   * a failure anyone would notice until it mattered.
   */
  var authored = flow.querySelector('[data-split]');
  if (authored) {
    var frag = document.createDocumentFragment();
    Array.prototype.slice.call(authored.childNodes).forEach(function (node) {
      if (node.nodeType === 3 && !node.textContent.trim()) return;
      var item = document.createElement('div');
      item.className = 'flow-item content';
      item.appendChild(node);
      frag.appendChild(item);
    });
    authored.parentNode.replaceChild(frag, authored);
  }

  var sheet = newPage();
  var blocks = Array.prototype.slice.call(flow.children);
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    sheet.appendChild(block);
    if (sheet.scrollHeight > sheet.clientHeight && sheet.childNodes.length > 1) {
      sheet.removeChild(block);
      sheet = newPage();
      sheet.appendChild(block);
    }
  }
  flow.parentNode.removeChild(flow);
})();
${PAGE_NUMBER_SCRIPT}
</script>

</body></html>`;
}

/** PDF with the letterhead repeated on every page. */
export async function renderAgreementPdf(a: Agreement) {
  const org = orgDetails();
  const logo = await letterheadLogo();
  // No margin templates: the letterhead is part of the document now, so the PDF
  // is a straight print of the same pages the preview shows.
  const pdf = await htmlToPdf(await renderAgreement(a), {});

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
/**
 * Emails an issued agreement to the second party, with the PDF attached.
 *
 * Only for documents that have actually been issued: a draft has no reference
 * number, and sending one invites the other side to sign something that cannot
 * be cited afterwards. Cancelled documents are refused for the same reason in
 * reverse.
 *
 * The PDF is rendered fresh rather than pulled from storage, so what lands in
 * their inbox is the document as it stands right now — the stored copy can lag
 * an edit made after issue.
 */
export async function sendAgreement(id: string, actorId: string) {
  const a = await getAgreement(id);

  if (a.status === "DRAFT") {
    throw new AppError(409, "Issue the agreement before sending it", "NOT_ISSUED");
  }
  if (a.status === "CANCELLED") {
    throw new AppError(409, "This agreement has been cancelled", "CANCELLED");
  }
  const to = a.partyEmail?.trim();
  if (!to) {
    throw new AppError(
      400,
      "Add an email address for the second party before sending",
      "NO_PARTY_EMAIL"
    );
  }

  const pdf = await renderAgreementPdf(a);
  const tpl = AGREEMENT_TEMPLATES[a.type];
  const fmt = (d: Date | null) =>
    d ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : null;

  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to,
    subject: `${a.title} — ${a.documentNo}`,
    html: Emails.agreementIssued({
      title: a.title,
      kind: tpl.label,
      documentNo: a.documentNo ?? "",
      partyName: a.partyName,
      recipientName: a.partySignatory,
      effectiveDate: fmt(a.effectiveDate),
      expiryDate: fmt(a.expiryDate),
      // A letter of support asks nothing of the reader; an MOU does.
      signatureRequired: a.type !== "SUPPORT",
    }),
    attachments: [
      { filename: `${safeFile(a.title)}-${(a.documentNo ?? "").split("/").join("-")}.pdf`, content: pdf },
    ],
  });

  if (error) {
    logger.error(`agreement ${a.documentNo} email failed: ${error.message}`);
    throw new AppError(502, `Could not send the email: ${error.message}`, "SEND_FAILED");
  }

  const updated = await prisma.agreement.update({
    where: { id },
    data: { sentAt: new Date(), sentTo: to, sentCount: { increment: 1 } },
  });

  await audit({
    action: "agreement.sent",
    entity: "Agreement",
    entityId: id,
    actorId,
    metadata: { documentNo: a.documentNo, to },
  });

  return { sentTo: to, sentAt: updated.sentAt, sentCount: updated.sentCount };
}

/** Titles become filenames, and a filename cannot carry a slash or a colon. */
function safeFile(title: string) {
  return title.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "Agreement";
}

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

/**
 * Moves an issued document between states.
 *
 * ISSUED is included as a destination so a mis-click on "Mark signed" can be
 * undone. Marking signed locks the wording, and the button sat one slip away
 * from a document nobody could edit or even send — an accident with no way back
 * is a worse design than a reversible one, and the reversal is audited like
 * everything else.
 */
export async function setStatus(
  id: string,
  status: "SIGNED" | "CANCELLED" | "ISSUED",
  actorId: string
) {
  const a = await getAgreement(id);
  if (!a.documentNo) {
    throw new AppError(409, "Issue the agreement before changing its status", "NOT_ISSUED");
  }
  const updated = await prisma.agreement.update({ where: { id }, data: { status } });
  await audit({
    action: `agreement.${status.toLowerCase()}`, entity: "Agreement", entityId: id,
    actorId, metadata: { documentNo: a.documentNo },
  });
  return updated;
}
