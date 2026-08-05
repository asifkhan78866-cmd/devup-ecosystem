import { Prisma, HrDocType } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { uploadFile } from "../../../lib/storage";
import { env } from "../../../config/env";
import { renderDocument, TemplateKey } from "./templates";
import { LOGO_URL, SITE_URL } from "../../../lib/email/layout";
import { htmlToPdf } from "../../../lib/pdf";
import { logger } from "../../../middleware/logger";
import { audit, AuditAction } from "../../shared/audit.service";

/**
 * THE generator. Every HR document in the system — offer letters, experience
 * letters, LORs, certificates, ID cards — is produced here and nowhere else.
 * Callers supply a template key and merge payload; branding is resolved from
 * the tenant automatically.
 */

export interface IssueArgs {
  startupId: string;
  docType: HrDocType;
  documentNo: string;
  templateKey: TemplateKey;
  payload: Record<string, unknown>;
  employeeId?: string;
  internId?: string;
  applicationId?: string;
  issuedBy: string;
  supersedesId?: string;
}

export async function getBranding(startupId: string) {
  const branding = await prisma.startupBranding.findUnique({ where: { startupId } });
  if (!branding) {
    throw new AppError(
      409,
      "Startup branding must be configured before issuing documents. Add legal name, address and signatory in Settings.",
      "BRANDING_MISSING"
    );
  }
  return branding;
}

/**
 * Creates the document record and renders its HTML.
 *
 * Deliberately does NOT render the PDF or upload anything: callers run this
 * inside a transaction to keep numbering atomic, and Chromium plus a storage
 * round-trip take seconds — far longer than Prisma's 5s interactive-transaction
 * budget. Blowing that budget rolls the whole offer back. Call `attachFile`
 * after the transaction commits.
 */
export async function issue(args: IssueArgs, tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma;
  const branding = await getBranding(args.startupId);
  const startup = await prisma.startup.findUnique({
    where: { id: args.startupId },
    select: { name: true, code: true, logoUrl: true, type: true },
  });

  // Freeze everything the document asserts at issue time. A later branding or
  // salary change must never alter what an already-issued letter says.
  const frozen = {
    ...args.payload,
    _branding: {
      legalName: branding.legalName,
      cin: branding.cin,
      addressLine1: branding.addressLine1,
      addressLine2: branding.addressLine2,
      city: branding.city,
      state: branding.state,
      pincode: branding.pincode,
      address: [branding.addressLine1, branding.addressLine2, branding.city, branding.state, branding.pincode]
        .filter(Boolean)
        .join(", "),
      logoUrl: branding.logoUrl ?? startup?.logoUrl ?? null,
      signatoryName: branding.signatoryName,
      signatoryTitle: branding.signatoryTitle,
      signatoryOrg: branding.signatoryOrg,
      signatureImageUrl: branding.signatureImageUrl,
      cosignatoryName: branding.cosignatoryName,
      cosignatoryTitle: branding.cosignatoryTitle,
      cosignatoryOrg: branding.cosignatoryOrg,
      cosignatureImageUrl: branding.cosignatureImageUrl,
      primaryColor: branding.primaryColor,
    },
    // type drives the letterhead wording: partners are not "part of" DevUp.
    _startup: { name: startup?.name, code: startup?.code, type: startup?.type },
    _documentNo: args.documentNo,
    _issuedAt: new Date().toISOString(),
    // DevUp mark on every issued document, alongside the startup's own branding.
    _devupLogo: LOGO_URL,
    _siteUrl: SITE_URL.replace(/^https?:\/\//, ""),
  };

  const html = renderDocument(args.templateKey, frozen);

  const doc = await client.hrDocument.create({
    data: {
      startupId: args.startupId,
      docType: args.docType,
      documentNo: args.documentNo,
      employeeId: args.employeeId,
      internId: args.internId,
      applicationId: args.applicationId,
      templateKey: args.templateKey,
      payload: frozen as Prisma.InputJsonValue,
      issuedBy: args.issuedBy,
      supersedesId: args.supersedesId,
    },
  });

  await audit(
    {
      action: AuditAction.DOCUMENT_ISSUED,
      entity: "HrDocument",
      entityId: doc.id,
      actorId: args.issuedBy,
      startupId: args.startupId,
      metadata: { docType: args.docType, documentNo: args.documentNo },
    },
    tx
  );

  return { ...doc, html };
}

/**
 * Renders the PDF, stores both formats and links them to the record.
 *
 * Runs outside any transaction and never throws: the document number is already
 * allocated and the record already exists, so a render or storage failure must
 * degrade to "no file yet" rather than losing a legally meaningful record.
 */
/**
 * Rebuilds the file for a document that was issued without one.
 *
 * A host missing Chromium, or a storage hiccup, leaves the record valid but
 * fileless — the letter exists and is numbered, there is just nothing to
 * download or attach. Re-rendering from the frozen payload produces exactly the
 * document that was issued, so this never rewrites history; it only fills the
 * gap. Reissuing instead would burn a second number for the same offer.
 */
export async function regenerateFile(startupId: string, documentId: string) {
  const doc = await prisma.hrDocument.findFirst({ where: { id: documentId, startupId } });
  if (!doc) throw new AppError(404, "Document not found", "NOT_FOUND");

  const html = renderDocument(doc.templateKey as TemplateKey, doc.payload as Record<string, unknown>);
  const file = await attachFile(
    { id: doc.id, docType: doc.docType, startupId: doc.startupId, documentNo: doc.documentNo },
    html
  );

  if (!file.pdfUrl) {
    throw new AppError(
      503,
      "Could not produce the file. PDF rendering is unavailable on this server — " +
        "install Chrome (build step: npx puppeteer browsers install chrome) and try again.",
      "PDF_UNAVAILABLE"
    );
  }

  return { documentNo: doc.documentNo, ...file, pdfBuffer: undefined };
}

export async function attachFile(doc: { id: string; docType: HrDocType; startupId: string; documentNo: string }, html: string) {
  const base = `${doc.startupId}/${doc.docType.toLowerCase()}/${doc.id}`;
  let pdfUrl: string | null = null;
  let htmlUrl: string | null = null;
  let pdfBuffer: Buffer | null = null;

  try {
    htmlUrl = await uploadFile(env.STORAGE_BUCKET_DOCUMENTS, `${base}.html`, Buffer.from(html, "utf-8"), "text/html");
  } catch (err) {
    logger.warn(`document HTML upload failed for ${doc.documentNo}: ${(err as Error).message}`);
  }

  try {
    // ID cards are card-sized; everything else is A4.
    const pdf = await htmlToPdf(html, doc.docType === "ID_CARD" ? { width: "54mm", height: "86mm" } : {});
    if (pdf) {
      pdfBuffer = pdf;
      pdfUrl = await uploadFile(env.STORAGE_BUCKET_DOCUMENTS, `${base}.pdf`, pdf, "application/pdf");
    }
  } catch (err) {
    logger.warn(`document PDF render failed for ${doc.documentNo}: ${(err as Error).message}`);
  }

  const finalUrl = pdfUrl ?? htmlUrl;
  if (finalUrl) {
    await prisma.hrDocument
      .update({ where: { id: doc.id }, data: { pdfUrl: finalUrl } })
      .catch((err) => logger.warn(`could not link file to ${doc.documentNo}: ${err.message}`));
  }

  return { pdfUrl: finalUrl, htmlUrl, pdfBuffer, pdfGenerated: Boolean(pdfUrl) };
}

/** Convenience for callers with no transaction of their own. */
export async function issueAndAttach(args: IssueArgs) {
  const doc = await issue(args);
  const file = await attachFile(doc, doc.html);
  return { ...doc, ...file };
}

export async function revoke(
  startupId: string,
  documentId: string,
  reason: string,
  actorId: string
) {
  const doc = await prisma.hrDocument.findFirst({ where: { id: documentId, startupId } });
  if (!doc) throw new AppError(404, "Document not found", "NOT_FOUND");
  if (doc.revokedAt) throw new AppError(409, "Document already revoked", "ALREADY_REVOKED");

  // Revoked documents are retained, never deleted — they are legal records.
  return prisma.hrDocument.update({
    where: { id: documentId },
    data: { revokedAt: new Date(), revokeReason: reason },
  });
}

export async function list(db: any, docType?: HrDocType) {
  return db.hrDocument.findMany({
    where: docType ? { docType } : {},
    orderBy: { issuedAt: "desc" },
    take: 200,
  });
}
