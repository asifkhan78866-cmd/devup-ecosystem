/**
 * Printed perk ticket.
 *
 * The paper is the artefact: someone walks into a coworking reception with
 * this in hand, and the desk has to be able to trust it without a system.
 * So everything needed to check it is on the ticket — the recipient's name,
 * the code, the expiry, and a QR that resolves to a verification page.
 *
 * One template serves every partner. The accent comes from the partner record,
 * so D2PR prints green and StartupsIndia red without a second file existing.
 */

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const INK = "#14181C";
const MUTED = "#5A6169";
const FAINT = "#8B9299";
const RULE = "#DDE1E5";

const money = (n: unknown) =>
  typeof n === "number" ? "₹" + n.toLocaleString("en-IN") : "";

const fmtDate = (d: unknown) =>
  d
    ? new Date(String(d)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";

export interface TicketPayload {
  partnerName: string;
  partnerLogoUrl?: string | null;
  brandColor: string;
  partnerAddress?: string | null;
  partnerPhone?: string | null;

  perkTitle: string;
  perkSubtitle?: string | null;
  headline?: string | null;
  highlights?: string[];
  terms?: string[];
  originalPrice?: number | null;
  finalPrice?: number | null;
  priceUnit?: string | null;
  percentOff?: number | null;

  recipientName: string;
  recipientEmail?: string | null;
  sourceEvent?: string | null;
  code: string;
  issuedAt: string | Date;
  expiresAt: string | Date;

  qrDataUrl?: string | null;
  devupLogoUrl?: string | null;
  siteUrl?: string;
  cin?: string | null;
}

/** Two tickets to an A4 portrait sheet, with a cut guide between them. */
export function renderTicketSheet(tickets: TicketPayload[], opts: { perSheet?: 1 | 2 } = {}) {
  const perSheet = opts.perSheet ?? 2;
  const pages: TicketPayload[][] = [];
  for (let i = 0; i < tickets.length; i += perSheet) pages.push(tickets.slice(i, i + perSheet));

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Perk tickets</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; background: #fff; color: ${INK};
         font-family: "Segoe UI", Arial, Helvetica, sans-serif; }

  .sheet { width: 210mm; height: 297mm; padding: 8mm; display: flex;
           flex-direction: column; gap: 6mm; page-break-after: always; }
  .sheet:last-child { page-break-after: auto; }

  /* A cut line rather than a border, so a mis-set printer does not print a
     frame the scissors then have to follow. */
  .cutline { border-top: 1px dashed ${RULE}; position: relative; }
  .cutline span { position: absolute; right: 0; top: -4.4mm;
                  font-size: 6pt; color: ${FAINT}; letter-spacing: 1px; }

  .ticket { flex: 1; display: flex; border: 1px solid ${RULE}; border-radius: 3mm;
            overflow: hidden; background: #FCFCFB; }

  /* Body */
  .body { flex: 1; padding: 7mm 8mm 6mm; display: flex; flex-direction: column; min-width: 0; }
  .brandbar { display: flex; align-items: center; gap: 4mm; padding-bottom: 4mm;
              border-bottom: 1px solid ${RULE}; }
  .plogo { height: 11mm; max-width: 42mm; width: auto; object-fit: contain; }
  .cross { font-size: 11pt; color: ${FAINT}; }
  .dlogo { height: 11mm; width: auto; object-fit: contain; }

  .headline { font-size: 21pt; font-weight: 800; line-height: 1.08; margin-top: 5mm;
              letter-spacing: -0.4px; }
  .accent { color: var(--accent); }
  .sub { font-size: 9.5pt; color: ${MUTED}; margin-top: 2mm; line-height: 1.45; }

  .chips { display: flex; flex-wrap: wrap; gap: 1.6mm; margin-top: 4.5mm; }
  .chip { font-size: 7.6pt; padding: 1.3mm 2.6mm; border-radius: 6mm;
          background: var(--accent-soft); color: var(--accent-ink);
          border: 0.5px solid var(--accent-line); white-space: nowrap; }

  .terms { margin: 4mm 0 0; padding-left: 4mm; font-size: 6.9pt; color: ${FAINT};
           line-height: 1.5; }

  /* The name is what stops this being a bearer instrument. */
  .holder { margin-top: auto; padding-top: 4mm; border-top: 1px solid ${RULE};
            display: flex; align-items: flex-end; justify-content: space-between; gap: 5mm; }
  .holder-label { font-size: 6.4pt; letter-spacing: 1.6px; text-transform: uppercase;
                  color: ${FAINT}; }
  .holder-name { font-size: 12pt; font-weight: 700; margin-top: 0.8mm; }
  .holder-meta { font-size: 7pt; color: ${MUTED}; margin-top: 0.6mm; }
  .venue { text-align: right; font-size: 7pt; color: ${MUTED}; line-height: 1.5; max-width: 58mm; }
  .venue b { color: ${INK}; font-weight: 600; }

  /* Stub */
  .stub { width: 52mm; flex-shrink: 0; background: var(--accent); color: #fff;
          padding: 6mm 5mm; display: flex; flex-direction: column;
          align-items: center; text-align: center; position: relative; }
  /* Perforation: a dashed seam reads as a tear-off on paper. */
  .perf { position: absolute; left: 0; top: 0; bottom: 0; width: 0;
          border-left: 1.2px dashed rgba(255,255,255,0.55); }
  .stub-kicker { font-size: 6.6pt; letter-spacing: 2.4px; text-transform: uppercase;
                 opacity: 0.85; }
  .stub-off { font-size: 27pt; font-weight: 800; line-height: 1; margin-top: 2.5mm; }
  .stub-off small { font-size: 11pt; font-weight: 700; }
  .stub-price { margin-top: 3mm; font-size: 8pt; opacity: 0.9; }
  .stub-price s { opacity: 0.7; }
  .stub-final { font-size: 15pt; font-weight: 800; margin-top: 0.8mm; }
  .stub-unit { font-size: 6.8pt; opacity: 0.85; letter-spacing: 1.2px; text-transform: uppercase; }

  .stub-rule { width: 100%; border-top: 1px dashed rgba(255,255,255,0.4); margin: 4mm 0; }

  .qr { width: 24mm; height: 24mm; background: #fff; padding: 1.2mm; border-radius: 1.4mm; }
  .qr img { width: 100%; height: 100%; display: block; }

  .code { font-family: "Consolas", "Courier New", monospace; font-size: 10pt;
          font-weight: 700; letter-spacing: 1.2px; margin-top: 3mm; }
  .code-cap { font-size: 6pt; letter-spacing: 1.6px; text-transform: uppercase;
              opacity: 0.8; margin-top: 1mm; }
  .expiry { margin-top: auto; font-size: 6.8pt; opacity: 0.9; line-height: 1.5; }

  .foot { font-size: 5.9pt; color: ${FAINT}; text-align: center;
          letter-spacing: 0.4px; padding-top: 1.5mm; }
</style></head><body>
${pages.map((page) => sheetHtml(page, perSheet)).join("")}
</body></html>`;
}

function sheetHtml(page: TicketPayload[], perSheet: number) {
  const items = page.map(
    (t, i) => (i > 0 ? `<div class="cutline"><span>CUT HERE</span></div>` : "") + ticketHtml(t)
  );
  // Keep a half-filled sheet's ticket the same size as a full one.
  const filler = perSheet === 2 && page.length === 1 ? `<div style="flex:1"></div>` : "";
  return `<div class="sheet">${items.join("")}${filler}</div>`;
}

function ticketHtml(t: TicketPayload) {
  const accent = t.brandColor || "#1F7A4D";
  const vars = [
    `--accent:${esc(accent)}`,
    `--accent-soft:${esc(accent)}14`,
    `--accent-line:${esc(accent)}33`,
    `--accent-ink:${esc(accent)}`,
  ].join(";");

  const off =
    t.percentOff != null
      ? `${t.percentOff}<small>% OFF</small>`
      : t.finalPrice != null && t.originalPrice != null
        ? `${Math.round((1 - t.finalPrice / t.originalPrice) * 100)}<small>% OFF</small>`
        : `<span style="font-size:13pt">EXCLUSIVE</span>`;

  const meta = [
    t.sourceEvent ? `Awarded at ${esc(t.sourceEvent)}` : "",
    t.recipientEmail ? esc(t.recipientEmail) : "",
  ]
    .filter(Boolean)
    .join(" &middot; ");

  return `<div class="ticket" style="${vars}">
  <div class="body">
    <div class="brandbar">
      ${
        t.partnerLogoUrl
          ? `<img class="plogo" src="${esc(t.partnerLogoUrl)}" alt="">`
          : `<div style="font-size:13pt;font-weight:800">${esc(t.partnerName)}</div>`
      }
      <span class="cross">&times;</span>
      ${t.devupLogoUrl ? `<img class="dlogo" src="${esc(t.devupLogoUrl)}" alt="DevUp Ecosystem">` : ""}
    </div>

    <div class="headline">${
      t.headline ? esc(t.headline) : `<span class="accent">${esc(t.perkTitle)}</span>`
    }</div>
    ${t.perkSubtitle ? `<div class="sub">${esc(t.perkSubtitle)}</div>` : ""}

    ${
      t.highlights && t.highlights.length
        ? `<div class="chips">${t.highlights
            .slice(0, 10)
            .map((h) => `<span class="chip">${esc(h)}</span>`)
            .join("")}</div>`
        : ""
    }

    ${
      t.terms && t.terms.length
        ? `<ul class="terms">${t.terms.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`
        : ""
    }

    <div class="holder">
      <div>
        <div class="holder-label">Issued to</div>
        <div class="holder-name">${esc(t.recipientName)}</div>
        <div class="holder-meta">${meta}</div>
      </div>
      <div class="venue">
        ${t.partnerAddress ? `<b>${esc(t.partnerName)}</b><br>${esc(t.partnerAddress)}<br>` : ""}
        ${t.partnerPhone ? esc(t.partnerPhone) : ""}
      </div>
    </div>

    <div class="foot">
      Non-transferable &middot; valid for the named holder only${
        t.cin ? ` &middot; Issued by DevUp Ecosystem, CIN ${esc(t.cin)}` : ""
      }
    </div>
  </div>

  <div class="stub">
    <div class="perf"></div>
    <div class="stub-kicker">Your Pass</div>
    <div class="stub-off">${off}</div>

    ${
      t.finalPrice != null
        ? `<div class="stub-price">${t.originalPrice != null ? `<s>${money(t.originalPrice)}</s>` : ""}</div>
           <div class="stub-final">${money(t.finalPrice)}</div>
           ${t.priceUnit ? `<div class="stub-unit">${esc(t.priceUnit)}</div>` : ""}`
        : ""
    }

    <div class="stub-rule"></div>

    ${t.qrDataUrl ? `<div class="qr"><img src="${esc(t.qrDataUrl)}" alt=""></div>` : ""}
    <div class="code">${esc(t.code)}</div>
    <div class="code-cap">Scan or enter to verify</div>

    <div class="expiry">
      Issued ${fmtDate(t.issuedAt)}<br>
      <b>Valid until ${fmtDate(t.expiresAt)}</b><br>
      ${esc(t.siteUrl ?? "devupecosystem.com")}
    </div>
  </div>
</div>`;
}
