import { env } from "../../../config/env";
import { LOGO_URL, SITE_URL } from "../../../lib/email/layout";
import { htmlToPdf } from "../../../lib/pdf";
import { AppError } from "../../../middleware/errorHandler";
import { renderDocument } from "./templates";
import { prisma } from "../../../lib/prisma";

export interface BatchInput {
  count: number;
  /** Pre-printed when the whole batch is for one college, blank otherwise. */
  college?: string;
  /** Pre-printed date, or blank for the organiser to fill in on the day. */
  issueDate?: string;
  /**
   * Who signs. Several are normal — a selection certificate carries the
   * ecosystem's leadership rather than one person's authority.
   */
  signatories?: Array<{ name: string; title: string }>;
  /** Older single-signatory callers. */
  signatoryName?: string;
  signatoryTitle?: string;
  /** Suppresses the per-copy serial, for a plain unnumbered stack. */
  numbered?: boolean;
  /** Starting serial offset for sequential batch numbering across runs. */
  startOffset?: number;
}

const MAX_COPIES = 100;
/** Three fit the width comfortably; a fourth starts crowding the seal. */
const MAX_SIGNATORIES = 3;

/**
 * Resolves the signature block, newest calling convention first.
 */
function signatoriesFor(input: BatchInput) {
  const list = (input.signatories ?? [])
    .map((s) => ({ name: s.name?.trim() ?? "", title: s.title?.trim() ?? "" }))
    .filter((s) => s.name);
  if (list.length) return list.slice(0, MAX_SIGNATORIES);

  if (input.signatoryName?.trim()) {
    return [{ name: input.signatoryName.trim(), title: input.signatoryTitle?.trim() ?? "" }];
  }
  return env.DEVUP_SIGNATORIES.slice(0, MAX_SIGNATORIES);
}

/**
 * Serial for one copy, e.g. DEVUP/ISC/2026-27/060826-03.
 * Uses global startOffset to guarantee unique sequential serials across batches.
 */
export function serialFor(index: number, startOffset = 1, at = new Date()) {
  const fy = at.getMonth() + 1 >= 4
    ? `${at.getFullYear()}-${String((at.getFullYear() + 1) % 100).padStart(2, "0")}`
    : `${at.getFullYear() - 1}-${String(at.getFullYear() % 100).padStart(2, "0")}`;
  const stamp =
    String(at.getDate()).padStart(2, "0") +
    String(at.getMonth() + 1).padStart(2, "0") +
    String(at.getFullYear() % 100).padStart(2, "0");
  const actualIndex = startOffset + index - 1;
  return `DEVUP/ISC/${fy}/${stamp}-${String(actualIndex).padStart(2, "0")}`;
}

export async function getNextSerialOffset(): Promise<number> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entity: "SelectionCertificate",
        action: "certificate.batch_printed",
      },
      select: { metadata: true },
    });

    let total = 0;
    for (const log of logs) {
      const meta = log.metadata as Record<string, any>;
      if (meta && typeof meta.count === "number") {
        total += meta.count;
      }
    }
    return total + 1;
  } catch {
    return 1;
  }
}

export async function getBatchHistory() {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entity: "SelectionCertificate",
        action: "certificate.batch_printed",
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return logs.map((l) => {
      const meta = (l.metadata ?? {}) as Record<string, any>;
      return {
        id: l.id,
        createdAt: l.createdAt,
        count: meta.count ?? 1,
        college: meta.college || null,
        issueDate: meta.issueDate || null,
        startSerial: meta.startSerial || null,
        endSerial: meta.endSerial || null,
        serialRange: meta.serialRange || null,
      };
    });
  } catch {
    return [];
  }
}

function onePage(input: BatchInput, index: number) {
  return renderDocument("SELECTION_CERTIFICATE", {
    _devupLogo: LOGO_URL,
    _devupLegalName: env.DEVUP_LEGAL_NAME,
    _devupCin: env.DEVUP_CIN,
    _siteUrl: SITE_URL.replace(/^https?:\/\//, ""),
    college: input.college?.trim() || undefined,
    issueDate: input.issueDate?.trim() || undefined,
    signatories: signatoriesFor(input),
    _devupSignatories: env.DEVUP_SIGNATORIES,
    serial: input.numbered === false ? undefined : serialFor(index, input.startOffset || 1),
  });
}

/** All copies in one document, so it prints as a single job. */
export function buildBatchHtml(input: BatchInput) {
  const count = Math.floor(input.count);
  if (!Number.isFinite(count) || count < 1) {
    throw new AppError(400, "Choose how many certificates to print", "INVALID_COUNT");
  }
  if (count > MAX_COPIES) {
    throw new AppError(400, `Print at most ${MAX_COPIES} at a time`, "TOO_MANY");
  }

  const first = onePage(input, 1);
  const style = first.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  const pageOf = (html: string) => html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? "";

  const pages = [pageOf(first)];
  for (let i = 2; i <= count; i++) pages.push(pageOf(onePage(input, i)));

  return `<!doctype html>
<html><head><meta charset="utf-8">
<title>Internship Selection Certificates</title>
<style>${style}</style>
</head><body>${pages.join("\n")}</body></html>`;
}

export async function buildBatchPdf(input: BatchInput) {
  const pdf = await htmlToPdf(buildBatchHtml(input));
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
