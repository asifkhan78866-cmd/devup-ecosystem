import {
  TIERS, AppointmentPayload, esc, fmtDate, pips,
  INK, MUTED, FAINT, RULE, PAPER,
} from "./appointmentTemplates";

/**
 * The certificate of appointment.
 *
 * This is the one that gets photographed and posted, so it carries nothing a
 * reader has to work through: no covenants, no jurisdiction clause, no term
 * schedule beyond the dates. A name, an office, a seal and three signatures.
 * Everything binding lives on the deed, which is a different document and reads
 * like one.
 *
 * Landscape, because that is the shape people recognise as an award and the
 * shape that survives being posted to a feed.
 */
export function renderCertificate(p: AppointmentPayload): string {
  const t = TIERS[p.role];
  const org = p.org;

  return `<!doctype html>
<html><head><meta charset="utf-8">
<title>Certificate of Appointment — ${esc(t.label)} — ${esc(p.fullName)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; background: ${PAPER}; color: ${INK};
         font-family: Georgia, "Times New Roman", serif; }

  .page { position: relative; width: 297mm; height: 210mm; overflow: hidden;
          background: ${PAPER}; }

  /* Same frame as the deed so the two read as one series, but drawn heavier —
     a certificate is allowed to announce itself. */
  .frame { position: absolute; inset: 0; padding: 8mm; }
  .frame-outer { width: 100%; height: 100%; border: 3.2px solid ${t.accent}; padding: 1.6mm; }
  .frame-mid { width: 100%; height: 100%; border: 0.6px solid ${t.accent}; padding: 1.4mm;
               background: repeating-linear-gradient(45deg,
                 ${t.accentSoft} 0 1.2mm, transparent 1.2mm 2.4mm); }
  .frame-inner { width: 100%; height: 100%; border: 0.8px solid ${t.accent}; background: ${PAPER}; }

  .rosette { position: absolute; width: 13mm; height: 13mm; border-radius: 50%;
             border: 0.7px solid ${t.accent};
             background: radial-gradient(circle, ${t.accentSoft} 0 22%, transparent 22% 46%,
                         ${t.accentSoft} 46% 54%, transparent 54%); }
  .r-tl { top: 5mm; left: 5mm; } .r-tr { top: 5mm; right: 5mm; }
  .r-bl { bottom: 5mm; left: 5mm; } .r-br { bottom: 5mm; right: 5mm; }

  .body { position: relative; z-index: 1; height: 100%;
          padding: 14mm 24mm 20mm; display: flex; flex-direction: column;
          align-items: center; text-align: center; }

  .crest-row { display: flex; align-items: center; justify-content: center; gap: 5mm; }
  .crest { height: 14mm; width: auto; object-fit: contain; }
  .pips { display: flex; flex-direction: column; gap: 1.2mm; }
  .pips i { display: block; width: 2.3mm; height: 2.3mm; transform: rotate(45deg); }

  .org { font-size: 13pt; font-weight: bold; letter-spacing: 3.4px;
         text-transform: uppercase; margin-top: 3.5mm; }
  .org-sub { font-family: Arial, Helvetica, sans-serif; font-size: 6.2pt; color: ${MUTED};
             letter-spacing: 2.4px; text-transform: uppercase; margin-top: 1.4mm; }

  .divider { display: flex; align-items: center; justify-content: center; gap: 3mm;
             width: 92mm; margin: 3.5mm 0 3mm; }
  .divider i { flex: 1; height: 0.6px; background: ${t.accent}; opacity: 0.55; }
  .divider b { width: 2.6mm; height: 2.6mm; background: ${t.accent}; transform: rotate(45deg); }

  .title { font-size: 19.5pt; font-weight: bold; letter-spacing: 7px;
           text-transform: uppercase; color: ${t.accent}; line-height: 1; }

  .certify { font-family: Arial, Helvetica, sans-serif; font-size: 7.4pt;
             letter-spacing: 3.2px; text-transform: uppercase; color: ${MUTED};
             margin-top: 4mm; }

  /* The name is the reason the page exists, so it gets the room. */
  .name { font-size: 27pt; line-height: 1.1; font-weight: normal; letter-spacing: 0.8px;
          margin-top: 3.5mm; padding: 0 10mm; }
  .name-rule { width: 118mm; height: 0.7px; background: ${RULE}; margin: 3mm 0 4mm; }

  .appointed { font-size: 10.5pt; color: ${MUTED}; }
  .ribbon { display: inline-block; margin-top: 3.5mm; padding: 2.4mm 12mm;
            background: ${t.accent}; color: #FFFFFF;
            font-family: Arial, Helvetica, sans-serif; font-size: 11pt;
            letter-spacing: 4.4px; text-transform: uppercase; font-weight: bold; }
  .territory { font-size: 12pt; margin-top: 3.5mm; }
  .territory b { font-weight: bold; }
  .term { font-family: Arial, Helvetica, sans-serif; font-size: 7.4pt; color: ${MUTED};
          letter-spacing: 1.5px; text-transform: uppercase; margin-top: 3mm; }
  .motto { font-style: italic; font-size: 8.4pt; color: ${FAINT}; margin-top: 2.5mm; }
  .under-seal { font-size: 9.4pt; color: ${MUTED}; margin-top: 4mm; max-width: 150mm;
                line-height: 1.7; }

  /* ── Foot: signatures on the left, seal on the right ──────────────── */
  .foot { margin-top: auto; width: 100%; display: flex; align-items: flex-end;
          justify-content: space-between; gap: 12mm; }
  .signs { display: flex; gap: 9mm; text-align: left; }
  .sign { position: relative; width: 68mm; }
  .sign-line { border-top: 0.9px solid ${INK}; padding-top: 1.6mm; }
  .sign-name { font-size: 8.4pt; font-weight: bold; line-height: 1.3; }
  .sign-role { font-size: 7.2pt; color: ${MUTED}; }

  /* Anchored to the signature line, not to the row.
     Centred on the row it sat over the middle of three names; with one name
     left it floated off to the right of a rule it was supposed to be inked
     across. Positioned from the cell it now lands on the line wherever the
     line is, and crosses it rather than hovering above. */
  .signs-wrap { flex: 1; }
  .stamp-over { position: absolute; left: 2mm; bottom: 0; width: 50mm; height: auto;
                transform: rotate(-3.5deg); opacity: 0.94; z-index: 2; }

  .seal-wrap { width: 44mm; flex-shrink: 0; text-align: center; }
  .wax { width: 33mm; height: auto; }
  .seal-cap { font-family: Arial, Helvetica, sans-serif; font-size: 5.8pt; color: ${FAINT};
              letter-spacing: 1.4px; text-transform: uppercase; margin-top: 1.5mm; }

  /* In the flow rather than pinned to the page: positioned absolutely it had
     no way to know the signatures had grown down into it. */
  .ref { width: 100%; margin-top: 3.5mm; padding-top: 2mm; border-top: 0.5px solid ${RULE};
         font-family: Arial, Helvetica, sans-serif; font-size: 6pt; color: ${FAINT};
         letter-spacing: 1.1px; display: flex; justify-content: space-between; }
</style></head>
<body>
<div class="page">
  <div class="frame">
    <div class="frame-outer"><div class="frame-mid"><div class="frame-inner"></div></div></div>
  </div>
  <span class="rosette r-tl"></span><span class="rosette r-tr"></span>
  <span class="rosette r-bl"></span><span class="rosette r-br"></span>

  <div class="body">
    <div class="crest-row">
      <div class="pips">${pips(t.rank, t.accent)}</div>
      ${p.logo ? `<img class="crest" src="${p.logo}" alt="">` : ""}
      <div class="pips">${pips(t.rank, t.accent)}</div>
    </div>
    <div class="org">${esc(org.legalName)}</div>
    <div class="org-sub">Lead DevUp Directorate &middot; ${esc(org.site)}</div>

    <div class="divider"><i></i><b></b><i></i></div>

    <div class="title">Certificate of Appointment</div>

    <div class="certify">This is to certify that</div>
    <div class="name">${esc(p.fullName)}</div>
    <div class="name-rule"></div>

    <div class="appointed">has been duly appointed to the office of</div>
    <div class="ribbon">${esc(t.label)}</div>
    <div class="territory">for <b>${esc(p.jurisdiction)}</b></div>
    <div class="term">
      ${esc(fmtDate(p.effectiveFrom))} &nbsp;&mdash;&nbsp; ${esc(fmtDate(p.effectiveTo))}
    </div>
    <div class="motto">${esc(t.motto)}</div>

    <div class="under-seal">
      Given under the Common Seal of ${esc(org.legalName)}, in recognition of the trust reposed
      in the Appointee and the office hereby conferred.
    </div>

    <div class="foot">
      <div class="signs-wrap">
        <div class="signs">
          <div class="sign">
            ${p.stamps.authorisedSign ? `<img class="stamp-over" src="${p.stamps.authorisedSign}" alt="">` : ""}
            <div class="sign-line">
              ${/* The stamp already reads "Authorised Signatory"; captioning it
                    again just prints the same words twice. */ ""}
              ${p.stamps.authorisedSign ? "" : `<div class="sign-role">Authorised Signatory</div>`}
            </div>
          </div>
        </div>
      </div>
      <div class="seal-wrap">
        ${p.stamps.waxSeal ? `<img class="wax" src="${p.stamps.waxSeal}" alt="Common Seal">` : ""}
        <div class="seal-cap">Common Seal</div>
      </div>
    </div>

    <div class="ref">
      <span>${esc(p.documentNo)}</span>
      <span>Issued ${esc(fmtDate(p.issuedAt))}</span>
      <span>Verify at ${esc(org.site)}</span>
    </div>
  </div>

</div>
</body></html>`;
}
