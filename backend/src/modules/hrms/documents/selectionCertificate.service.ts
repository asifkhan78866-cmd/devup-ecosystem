import { env } from "../../../config/env";
import { LOGO_URL, SITE_URL } from "../../../lib/email/layout";
import { htmlToPdf } from "../../../lib/pdf";
import { AppError } from "../../../middleware/errorHandler";
import { renderDocument } from "./templates";

/**
 * Blank internship selection certificates for events.
 *
 * Organisers print a stack, hand them to the students who performed best on the
 * day and write the names in by hand, so nothing here is merged from a record —
 * there is no recipient yet. It is also DevUp-branded alone: which startup a
 * student ends up joining is decided later, and printing one company's logo now
 * would promise something specific that has not been agreed.
 *
 * Because there is no recipient there is no HrDocument either. These are blank
 * forms, not issued documents; the register entry happens when a name goes on
 * one.
 */

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
}

const MAX_COPIES = 100;
/** Three fit the width comfortably; a fourth starts crowding the seal. */
const MAX_SIGNATORIES = 3;

/**
 * Resolves the signature block, newest calling convention first.
 *
 * Falls back to the configured ecosystem signatories so a caller that sends
 * nothing still produces a signed certificate rather than a blank rule.
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
 *
 * Date-stamped rather than drawn from a stored counter: these are blank forms
 * printed in batches, and a batch reprinted after a paper jam should not
 * consume numbers from the same run as real issued documents. Date plus index
 * is enough to tell one stack from another when reconciling who got what.
 */
function serialFor(index: number, at = new Date()) {
  const fy = at.getMonth() + 1 >= 4
    ? `${at.getFullYear()}-${String((at.getFullYear() + 1) % 100).padStart(2, "0")}`
    : `${at.getFullYear() - 1}-${String(at.getFullYear() % 100).padStart(2, "0")}`;
  const stamp =
    String(at.getDate()).padStart(2, "0") +
    String(at.getMonth() + 1).padStart(2, "0") +
    String(at.getFullYear() % 100).padStart(2, "0");
  return `DEVUP/ISC/${fy}/${stamp}-${String(index).padStart(2, "0")}`;
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
    // The full board goes in the foot regardless of who signs this batch.
    _devupSignatories: env.DEVUP_SIGNATORIES,
    serial: input.numbered === false ? undefined : serialFor(index),
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

  // One render carries the stylesheet; the rest contribute only their page, so
  // the design stays defined in exactly one place.
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
