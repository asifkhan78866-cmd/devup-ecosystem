import { env } from "../../config/env";
import { LOGO_URL, SITE_URL } from "../../lib/email/layout";
import { logger } from "../../middleware/logger";

/**
 * DevUp Ecosystem letterhead.
 *
 * Two halves that have to agree: a running header and footer drawn by Chrome
 * in the page margins, and the body styles for whatever is typed between them.
 * Chrome renders margin templates in isolation — no shared stylesheet, no
 * relative URLs, no inherited font — so everything they need is inlined, and
 * the measurements here are the single source of truth for how much room the
 * body has.
 */

const INK = "#111111";
const MUTED = "#555555";
const FAINT = "#8A8A8A";
const RULE = "#D8D8D8";

/** Reserved margins. The header and footer are drawn inside these. */
export const PAGE_MARGIN = {
  top: "36mm",
  bottom: "24mm",
  left: "20mm",
  right: "20mm",
};

let logoDataUri: string | null = null;
let logoTried = false;

/**
 * The logo as a data URI.
 *
 * A header template cannot fetch: an https image in there renders as an empty
 * gap about half the time and there is no way to tell from the PDF which time
 * it was. Fetching it once here and inlining the bytes removes the question.
 */
export async function letterheadLogo(): Promise<string | null> {
  if (logoTried) return logoDataUri;
  logoTried = true;
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) throw new Error(`logo fetch ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const type = res.headers.get("content-type") ?? "image/png";
    logoDataUri = `data:${type};base64,${buf.toString("base64")}`;
  } catch (err) {
    // A letterhead without its mark is still a valid document; a crashed
    // render is not.
    logger.warn(`letterhead logo unavailable: ${(err as Error).message}`);
    logoDataUri = null;
  }
  return logoDataUri;
}

export interface LetterheadOrg {
  legalName: string;
  cin: string;
  address: string;
  email: string;
  phone?: string;
  site: string;
}

export function orgDetails(): LetterheadOrg {
  return {
    legalName: "DevUp Ecosystem Pvt Ltd",
    cin: env.DEVUP_CIN,
    address: "Hitech City, Hyderabad, Telangana 500081, India",
    email: env.RESEND_FROM_EMAIL,
    site: SITE_URL.replace(/^https?:\/\//, ""),
  };
}

/**
 * Drawn at the top of every page.
 *
 * Padding rather than margins: Chrome hands the template a box exactly the
 * width of the page, so width:100% plus side margins overflows it and silently
 * clips whatever sits on the right — the CIN, in this case.
 */
export function headerTemplate(logo: string | null, org: LetterheadOrg) {
  return `
<div style="width:100%;box-sizing:border-box;padding:0 20mm;font-family:Georgia,'Times New Roman',serif;color:${INK};">
  <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:3mm;">
    <div style="display:flex;align-items:center;gap:4mm;">
      ${logo ? `<img src="${logo}" style="height:13mm;width:auto;object-fit:contain;">` : ""}
      <div>
        <div style="font-size:12pt;font-weight:bold;letter-spacing:0.3px;line-height:1.15;">
          ${esc(org.legalName)}
        </div>
        <div style="font-size:6.5pt;color:${MUTED};margin-top:0.6mm;letter-spacing:0.3px;">
          Building People. Products. Possibilities.
        </div>
      </div>
    </div>
    <div style="text-align:right;font-size:6.5pt;color:${FAINT};line-height:1.5;">
      <div>CIN: ${esc(org.cin)}</div>
      <div>${esc(org.site)}</div>
    </div>
  </div>
  <div style="height:1.2px;background:${INK};"></div>
  <div style="height:0.5px;background:${RULE};margin-top:0.7mm;"></div>
</div>`;
}

/** Drawn at the foot of every page, with the page count. */
export function footerTemplate(org: LetterheadOrg) {
  return `
<div style="width:100%;box-sizing:border-box;padding:0 20mm;font-family:Arial,Helvetica,sans-serif;color:${FAINT};font-size:6.5pt;">
  <div style="height:0.5px;background:${RULE};margin-bottom:2mm;"></div>
  <div style="display:flex;align-items:baseline;justify-content:space-between;gap:6mm;">
    <span style="max-width:120mm;line-height:1.45;">
      ${esc(org.address)} &middot; ${esc(org.email)}
    </span>
    <span style="white-space:nowrap;">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </span>
  </div>
</div>`;
}

/**
 * Page furniture for documents that paginate themselves.
 *
 * The letterhead used to exist only inside Chrome's margin boxes, which meant
 * it appeared in the PDF and nowhere else — so the on-screen preview was a bare
 * page with no mark, no margins and no footer, and looked nothing like the
 * document it was previewing. Drawing the same header and footer into real page
 * elements makes the two identical, and the preview becomes worth looking at.
 */
export function pageChromeCss() {
  return `
  @page { size: A4; margin: 0; }
  .page { position: relative; width: 210mm; height: 297mm; overflow: hidden;
          background: #FFFFFF; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .sheet { height: 100%; padding: ${PAGE_MARGIN.top} ${PAGE_MARGIN.right} ${PAGE_MARGIN.bottom};
           display: flex; flex-direction: column; }
  .sheet > .flow-item { flex-shrink: 0; }
  /* The header is drawn at the top of the padding box, the footer at the foot,
     both outside the flowing content. */
  .lh-head { position: absolute; top: 12mm; left: 0; right: 0; }
  .lh-foot { position: absolute; bottom: 10mm; left: 0; right: 0; }
  `;
}

/** Fills "Page N of M" once the content has been laid out. */
export const PAGE_NUMBER_SCRIPT = `
(function () {
  var pages = document.querySelectorAll('.page');
  pages.forEach(function (page, i) {
    page.querySelectorAll('.pageNumber').forEach(function (el) { el.textContent = String(i + 1); });
    page.querySelectorAll('.totalPages').forEach(function (el) { el.textContent = String(pages.length); });
  });
})();`;

/**
 * Styles for the body between the margins.
 *
 * Every tag the editor can produce is given a size here, because content is
 * pasted from Word and Google Docs and arrives carrying whatever those decided
 * — without this a pasted heading renders at browser-default 32px and blows
 * the page apart.
 */
export function bodyStyles() {
  return `
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; background: #fff; color: ${INK};
         font-family: Georgia, "Times New Roman", serif;
         font-size: 10.5pt; line-height: 1.6; }

  .doc-title { text-align: center; font-size: 13pt; font-weight: bold;
               letter-spacing: 2.2px; text-transform: uppercase;
               margin: 0 0 2mm; }
  .doc-sub { text-align: center; font-size: 8.5pt; color: ${MUTED};
             letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6mm; }

  .meta { display: flex; justify-content: space-between; font-size: 9pt;
          color: ${MUTED}; padding-bottom: 2mm; margin-bottom: 5mm;
          border-bottom: 0.5px solid ${RULE}; }
  .meta b { color: ${INK}; font-weight: bold; }

  .parties { margin-bottom: 6mm; font-size: 10pt; }
  .parties .row { display: flex; gap: 4mm; margin-bottom: 1.5mm; }
  .parties .k { width: 26mm; color: ${MUTED}; flex-shrink: 0; }
  .parties .v { font-weight: bold; }

  /* Authored content. Kept modest so a pasted document cannot break the page. */
  .content p { margin: 0 0 3mm; text-align: justify; }
  .content h1 { font-size: 12pt; margin: 6mm 0 2.5mm; letter-spacing: 0.4px; }
  .content h2 { font-size: 11pt; margin: 5mm 0 2mm; }
  .content h3 { font-size: 10.5pt; margin: 4mm 0 1.5mm; }
  .content h1, .content h2, .content h3 { font-weight: bold; page-break-after: avoid; }
  .content ul, .content ol { margin: 0 0 3mm; padding-left: 7mm; }
  .content li { margin-bottom: 1.2mm; text-align: justify; }
  .content strong, .content b { font-weight: bold; }
  .content em, .content i { font-style: italic; }
  .content u { text-decoration: underline; }
  .content blockquote { margin: 0 0 3mm 6mm; padding-left: 4mm;
                        border-left: 2px solid ${RULE}; color: ${MUTED}; }
  .content a { color: ${INK}; text-decoration: underline; }
  .content table { width: 100%; border-collapse: collapse; margin: 0 0 4mm;
                   font-size: 9.5pt; }
  .content th, .content td { border: 0.5px solid ${RULE}; padding: 1.6mm 2mm;
                             text-align: left; vertical-align: top; }
  .content th { font-weight: bold; background: #FAFAFA; }
  .content hr { border: 0; border-top: 0.5px solid ${RULE}; margin: 5mm 0; }

  /* A signature block split across two pages looks like a forgery. */
  .signatures { margin-top: 12mm; page-break-inside: avoid; break-inside: avoid; }
  .sig-grid { display: flex; gap: 14mm; }
  .sig-col { flex: 1; }
  .sig-for { font-size: 8.5pt; color: ${MUTED}; font-style: italic;
             margin-bottom: 11mm; }
  .sig-line { border-top: 1px solid ${INK}; padding-top: 1.8mm; }
  .sig-name { font-size: 10pt; font-weight: bold; }
  .sig-role { font-size: 8.5pt; color: ${MUTED}; }
  .sig-meta { font-size: 8pt; color: ${FAINT}; margin-top: 2mm; line-height: 1.6; }
  .sig-fill { display: inline-block; border-bottom: 0.6px solid #B5B5B5;
              min-width: 26mm; }
  `;
}

export function esc(v: unknown) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
