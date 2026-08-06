export type TemplateKey =
  | "FOUNDER_LETTER"
  | "OFFER_LETTER"
  | "EXPERIENCE_LETTER"
  | "LOR"
  | "CERTIFICATE"
  | "ID_CARD"
  | "RELIEVING";

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Legal names often already end in a period — do not add a second one. */
const sentence = (v: unknown) => {
  const t = String(v ?? "").trim();
  return t.endsWith(".") ? t.slice(0, -1) : t;
};

const fmtDate = (d: unknown) =>
  d
    ? new Date(String(d)).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

/* ─────────────────────────────────────────────────────────
   Document design system.

   Deliberately monochrome and typographic: black text, hairline rules, no
   gradients or decorative colour. These are legal records that get printed on
   plain paper and handed to colleges and employers — restraint reads as
   credible, decoration reads as generated. The startup's own colour appears
   nowhere; only its logo.

   Everything targets a single A4 page.
   ───────────────────────────────────────────────────────── */

const INK = "#111111";
const MUTED = "#555555";
const FAINT = "#8A8A8A";
const RULE = "#D8D8D8";

/** Documents are signed at ecosystem level unless branding overrides it. */
const SIGNING_ORG = "DevUp Ecosystem";

/**
 * Ecosystem partners are independent companies that DevUp collaborates with and
 * places people into. Saying they are "part of" DevUp would misstate the
 * relationship on a legal document, so the letterhead names it accurately.
 */
function relationLine(p: any) {
  return p._startup?.type === "ECOSYSTEM_PARTNER"
    ? "Official Startup Ecosystem Partner of DevUp Ecosystem"
    : "Part of the DevUp Ecosystem";
}

/** Registered address, the way it appears on a real company letterhead. */
function addressLine(b: any) {
  return [b?.addressLine1, b?.addressLine2, b?.city, b?.state, b?.pincode]
    .filter(Boolean)
    .join(", ");
}

function styles() {
  return `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; background: #fff; color: ${INK};
         font-family: Georgia, "Times New Roman", serif;
         font-size: 10pt; line-height: 1.45; }

  .sheet { width: 210mm; height: 297mm; padding: 9mm 16mm 0;
           display: flex; flex-direction: column; }

  /* ── Letterhead ── */
  .head { display: flex; align-items: center; gap: 7mm; padding-bottom: 3mm; }
  .logos { display: flex; align-items: center; gap: 4mm; flex-shrink: 0; }
  .logo { height: 20mm; width: auto; max-width: 44mm; object-fit: contain; }
  .logo-sep { width: 1px; height: 15mm; background: ${RULE}; }
  .org { flex: 1; min-width: 0; text-align: right; }
  .org-name { font-size: 15pt; font-weight: bold; letter-spacing: 0.2px;
              color: ${INK}; line-height: 1.2; }
  .org-sub { font-size: 8pt; color: ${MUTED}; margin-top: 1mm; }
  .org-addr { font-size: 7.5pt; color: ${FAINT}; margin-top: 0.8mm; line-height: 1.35; }

  .confidential { text-align: center; font-family: Arial, Helvetica, sans-serif;
                  font-size: 6.5pt; letter-spacing: 1.6px; text-transform: uppercase;
                  color: ${FAINT}; margin-top: 3.5mm; }
  .rule { height: 1.6px; background: ${INK}; }
  .rule-thin { height: 0.6px; background: ${RULE}; margin-top: 0.8mm; }

  /* ── Title ── */
  .title { text-align: center; margin: 3mm 0 3.5mm; font-size: 13pt; font-weight: bold;
           letter-spacing: 2.4px; text-transform: uppercase; color: ${INK}; }

  .meta { display: flex; justify-content: space-between; font-size: 9pt;
          color: ${MUTED}; margin-bottom: 3.5mm; }
  .meta b { color: ${INK}; font-weight: bold; }

  /* ── Body ── */
  .body { flex: 1; }
  .body p { margin: 0 0 2.2mm; text-align: justify; }
  .strong { font-weight: bold; color: ${INK}; }

  .section { font-size: 9pt; font-weight: bold; letter-spacing: 1.6px;
             text-transform: uppercase; color: ${INK}; margin: 3mm 0 1.6mm;
             padding-bottom: 1.2mm; border-bottom: 1px solid ${INK}; }

  table.kv { width: 100%; border-collapse: collapse; margin-bottom: 3mm; }
  table.kv td { padding: 1.05mm 0; font-size: 9.5pt; vertical-align: top;
                border-bottom: 0.5px solid ${RULE}; }
  table.kv td.k { width: 45mm; color: ${MUTED}; }
  table.kv td.v { color: ${INK}; font-weight: bold; }
  table.kv tr:last-child td { border-bottom: none; }

  .terms { margin: 1.5mm 0 2mm; padding-left: 5mm; font-size: 8.6pt; color: ${MUTED}; }
  .terms li { margin-bottom: 0.7mm; text-align: justify; padding-left: 1mm; }
  .terms .strong { color: ${INK}; }

  /* ── Signatures ── */
  .behalf { margin-top: 4mm; font-size: 8.5pt; color: ${MUTED}; font-style: italic; }
  .sign { display: flex; align-items: flex-end; gap: 10mm; margin-top: 1.5mm; }
  .sig-col { flex: 1; min-width: 0; max-width: 62mm; }
  .sig-img { height: 9mm; margin-bottom: 1mm; }
  .sig-space { height: 9mm; }
  .sig-rule { border-top: 1px solid ${INK}; padding-top: 1.5mm; }
  .sig-name { font-size: 10pt; font-weight: bold; }
  .sig-role { font-size: 8.5pt; color: ${MUTED}; }

  /* Empty box the physical company seal is stamped into. */
  .stamp { width: 28mm; height: 28mm; border: 1px dashed ${RULE}; border-radius: 2mm;
           display: flex; align-items: center; justify-content: center; text-align: center;
           font-family: Arial, Helvetica, sans-serif; font-size: 6.5pt; color: #B5B5B5;
           letter-spacing: 0.6px; text-transform: uppercase; flex-shrink: 0;
           margin-left: auto; }

  /* Founder letters: several signatures across one row. */
  .sign-row { display: flex; align-items: flex-end; gap: 8mm; margin-top: 8mm; }
  .sign-cell { flex: 1; min-width: 0; }
  .sign-line { border-top: 1px solid ${INK}; padding-top: 1.5mm; }

  /* Acceptance sits on its own rule beneath the signatures, like a contract. */
  .accept-row { display: flex; align-items: baseline; gap: 6mm; margin-top: 4.5mm;
                padding-top: 2.5mm; border-top: 0.6px solid ${RULE}; font-size: 8.5pt;
                color: ${MUTED}; }
  .accept-h { font-weight: bold; color: ${INK}; text-transform: uppercase;
              letter-spacing: 1px; font-size: 8pt; white-space: nowrap; }
  .accept-f { white-space: nowrap; }
  .accept-f i { display: inline-block; width: 28mm; border-bottom: 0.6px solid #B5B5B5;
                margin-left: 1.5mm; }

  /* ── Footer ── */
  .foot { margin-top: auto; padding: 2mm 0 3mm; border-top: 0.6px solid ${RULE};
          font-family: Arial, Helvetica, sans-serif; font-size: 7pt; color: ${FAINT}; }
  .foot-row { display: flex; justify-content: space-between; gap: 6mm; }
  .foot-issuer { margin-top: 1mm; text-align: center; color: ${MUTED}; }
  .foot b { color: ${MUTED}; font-weight: normal; }

  /* Certificates read better centred — horizontally and on the page. */
  .centre { text-align: center; display: flex; flex-direction: column;
            justify-content: center; }
  .centre p { text-align: center; }
  .recipient { font-size: 20pt; font-weight: bold; margin: 4mm 0 2mm;
               letter-spacing: 0.3px; }
  `;
}

function logos(p: any) {
  const b = p._branding ?? {};
  return `<div class="logos">
    ${p._devupLogo ? `<img class="logo" src="${esc(p._devupLogo)}" alt="DevUp Ecosystem">` : ""}
    ${b.logoUrl ? `<span class="logo-sep"></span><img class="logo" src="${esc(b.logoUrl)}" alt="">` : ""}
  </div>`;
}

function signatoryBlock(name: string, title: string, org: string, image?: string) {
  return `<div class="sig-col">
      ${image ? `<img class="sig-img" src="${esc(image)}" alt="">` : `<div class="sig-space"></div>`}
      <div class="sig-rule">
        <div class="sig-name">${esc(name)}</div>
        <div class="sig-role">${esc(title)}</div>
        <div class="sig-role">${esc(org)}</div>
      </div>
    </div>`;
}

/**
 * Signatories on the left, seal to the right of them, and the candidate's
 * acceptance on its own row underneath.
 *
 * A partner's letter carries two signatures: DevUp signs because it placed the
 * person, and the partner's own executive signs because they are the employer.
 * Both appear over "For and on behalf of", which is what makes a letter read as
 * executed by a company rather than typed by a person.
 */
function signatures(p: any, withAcceptance: boolean) {
  const b = p._branding ?? {};
  const primaryOrg = b.signatoryOrg || SIGNING_ORG;
  const hasCo = Boolean(b.cosignatoryName && b.cosignatoryTitle);

  const behalf = hasCo
    ? `${sentence(primaryOrg)} and ${sentence(b.cosignatoryOrg || b.legalName)}`
    : sentence(primaryOrg);

  return `<div class="behalf">For and on behalf of ${esc(behalf)}</div>
  <div class="sign">
    ${signatoryBlock(b.signatoryName, b.signatoryTitle, primaryOrg, b.signatureImageUrl)}
    ${
      hasCo
        ? signatoryBlock(
            b.cosignatoryName,
            b.cosignatoryTitle,
            b.cosignatoryOrg || b.legalName,
            b.cosignatureImageUrl
          )
        : ""
    }
    <div class="stamp">Company<br>Seal</div>
  </div>
  ${
    withAcceptance
      ? `<div class="accept-row">
           <span class="accept-h">Accepted By</span>
           <span class="accept-f">Name<i></i></span>
           <span class="accept-f">Signature<i></i></span>
           <span class="accept-f">Date<i></i></span>
         </div>`
      : ""
  }`;
}

/**
 * Signature strip for founder letters.
 *
 * Appointing a founder is the ecosystem's own act, so DevUp's founders sign it
 * together. Laid out as an even row of ruled lines rather than the two tall
 * columns used elsewhere: three signatures side by side stay readable, and the
 * letter keeps to a single page.
 */
function ecosystemSignatures(p: any) {
  const signers: Array<{ name: string; title: string }> = Array.isArray(p._devupSignatories)
    ? p._devupSignatories
    : [];
  if (signers.length === 0) return signatures(p, false);

  return `<div class="behalf">For and on behalf of ${esc(p._devupLegalName ?? SIGNING_ORG)}</div>
  <div class="sign-row">
    ${signers
      .map(
        (s) => `<div class="sign-cell">
        <div class="sign-line"></div>
        <div class="sig-name">${esc(s.name)}</div>
        <div class="sig-role">${esc(s.title)}</div>
      </div>`
      )
      .join("")}
    <div class="stamp">Company<br>Seal</div>
  </div>`;
}

/** The single-page A4 frame every letter prints inside. */
function sheet(p: any, title: string, body: string, centre = false, confidential = false) {
  const b = p._branding ?? {};
  const orgName = b.legalName || p._startup?.name || "";
  const address = addressLine(b);

  return `<!doctype html>
<html><head><meta charset="utf-8">
<title>${esc(title)} — ${esc(p._documentNo)}</title>
<style>${styles()}</style>
</head><body>
<div class="sheet">
  <div class="head">
    ${logos(p)}
    <div class="org">
      <div class="org-name">${esc(orgName)}</div>
      <div class="org-sub">${esc(relationLine(p))}</div>
      ${address ? `<div class="org-addr">${esc(address)}</div>` : ""}
    </div>
  </div>
  <div class="rule"></div><div class="rule-thin"></div>

  ${confidential ? `<div class="confidential">Private &amp; Confidential</div>` : ""}
  <div class="title">${esc(title)}</div>

  <div class="meta">
    <div>Ref: <b>${esc(p._documentNo)}</b></div>
    <div>Date: <b>${fmtDate(p._issuedAt)}</b></div>
  </div>

  <div class="body${centre ? " centre" : ""}">${body}</div>

  <div class="foot">
    <div class="foot-row">
      <span>${esc(p._documentNo)}</span>
      <span>${[esc(orgName), b.cin ? `CIN: ${esc(b.cin)}` : "", address ? esc(address) : ""]
        .filter(Boolean)
        .join(" · ")}</span>
      <span>Verify at <b>${esc(p._siteUrl)}</b></span>
    </div>
    ${
      /* The issuing entity and its registered number. Attributed explicitly to
         the ecosystem: this CIN belongs to DevUp, and printing it beside a
         partner's name would assert it was theirs. */
      p._devupCin
        ? `<div class="foot-issuer">Issued by ${esc(p._devupLegalName)} · CIN: ${esc(p._devupCin)}</div>`
        : ""
    }
  </div>
</div>
</body></html>`;
}

const TEMPLATES: Record<TemplateKey, (p: any) => string> = {
  OFFER_LETTER: (p) => {
    const isIntern = p.employmentType === "INTERNSHIP";
    const title = isIntern ? "Internship Offer Letter" : "Offer of Employment";
    const org = sentence(p._branding?.legalName || p._startup?.name);

    const rows: Array<[string, unknown]> = [
      ["Position", p.designation],
      ["Department", p.department],
      ["Engagement Type", String(p.employmentType ?? "").replace(/_/g, " ")],
      ["Duration", p.durationMonths ? `${p.durationMonths} month${p.durationMonths === 1 ? "" : "s"}` : null],
      ["Annual Compensation", p.ctc],
      ["Monthly Stipend", p.stipend],
      ["Work Mode", String(p.workMode ?? "").replace(/_/g, " ")],
      ["Location", p.location],
      ["Date of Joining", p.joiningDate ? fmtDate(p.joiningDate) : null],
    ].filter((row): row is [string, unknown] => Boolean(row[1]));

    return sheet(
      p,
      title,
      `
      <p>Dear <span class="strong">${esc(p.candidateName)}</span>,</p>

      <p>We are pleased to offer you the position of <span class="strong">${esc(p.designation)}</span>
        at ${esc(org)}${
          isIntern && p.durationMonths
            ? ` for a duration of ${esc(p.durationMonths)} month${p.durationMonths === 1 ? "" : "s"}`
            : ""
        }. ${
          isIntern
            ? "This internship is intended to provide practical industry exposure and the opportunity to contribute to live projects."
            : "We were impressed by what you brought to the interview process and look forward to your contribution."
        }</p>

      <div class="section">${isIntern ? "Internship Details" : "Position Details"}</div>
      <table class="kv">
        ${rows.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v as string)}</td></tr>`).join("")}
      </table>

      <p>${
        isIntern
          ? `On successful completion you may be considered for an Internship Completion Certificate, a Letter of Recommendation based on performance, and future opportunities with ${esc(org)}.`
          : `Your employment will be governed by the company's policies as amended from time to time. A detailed annexure covering compensation and benefits will be shared on joining.`
      }</p>

      <div class="section">Terms of this Offer</div>
      <ol class="terms">
        <li>This offer is valid until <span class="strong">${fmtDate(p.expiresAt)}</span>, two days
          before your date of joining, and lapses automatically if unaccepted by that date.</li>
        <li>This offer is contingent on satisfactory verification of the documents listed below and
          of the information furnished by you during the selection process.</li>
        <li>You are expected to maintain the confidentiality of all proprietary information, and to
          not disclose the terms of this offer to any third party.</li>
        <li>Failure to join on the agreed date without prior written intimation shall be treated as
          withdrawal of this offer.</li>
      </ol>

      <div class="section">Documents Required Before Joining</div>
      <ul class="terms">
        <li>Aadhaar card and ${isIntern ? "College ID card" : "PAN card"}</li>
        <li>Latest marksheet or degree certificate</li>
        <li>Passport-size photograph</li>
        ${isIntern ? "" : "<li>Bank account details for payroll</li>"}
      </ul>

      <p>We welcome you to ${esc(org)} and wish you a successful tenure.</p>

      ${signatures(p, true)}
    `,
      false,
      true
    );
  },

  /**
   * Confirms someone as a founding member.
   *
   * Not an offer: there is nothing to accept, no stipend, no joining date and
   * no signature box for the recipient. A founder was there before the company
   * had anything to offer, so the letter records that fact rather than
   * proposing terms.
   */
  FOUNDER_LETTER: (p) => {
    const org = sentence(p._branding?.legalName || p._startup?.name);
    const title = String(p.designation ?? "Founder").trim();

    /**
     * The heading follows the actual title. Calling a COO's letter a "Founder
     * Appointment Letter" would state something untrue on the one document they
     * will show to a bank or a visa office.
     */
    const isFounder = /founder/i.test(title);
    // "a Founder" but "the Chief Operating Officer" — one of several, one of one.
    const article = isFounder ? "a" : /^[aeiou]/i.test(title) ? "an" : "the";

    const rows: Array<[string, unknown]> = [
      ["Name", p.fullName],
      ["Designation", title],
      ["Organisation", org],
      ["Associated Since", p.since ? fmtDate(p.since) : null],
    ].filter((row): row is [string, unknown] => Boolean(row[1]));

    return sheet(
      p,
      isFounder ? "Founder Appointment Letter" : "Appointment Letter",
      `
      <p>To Whom It May Concern,</p>

      <p>This is to certify that <span class="strong">${esc(p.fullName)}</span> is ${article}
        <span class="strong">${esc(title)}</span> of ${esc(org)}${
          p._startup?.type === "ECOSYSTEM_PARTNER"
            ? ", an official startup ecosystem partner of DevUp Ecosystem"
            : ", a venture within the DevUp Ecosystem"
        }.</p>

      <div class="section">Details</div>
      <table class="kv">
        ${rows.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v as string)}</td></tr>`).join("")}
      </table>

      <p>${esc(
        p.body ??
          `In this capacity they hold responsibility for the direction and operation of ${sentence(org)}, ` +
            `and are authorised to represent it in the ordinary course of its business.`
      )}</p>

      <p>This letter is issued on request for the purpose of verification, and remains valid
        so long as the association continues.</p>

      ${ecosystemSignatures(p)}
    `
    );
  },

  EXPERIENCE_LETTER: (p) =>
    sheet(
      p,
      "Experience Certificate",
      `
      <p>To Whom It May Concern,</p>

      <p>This is to certify that <span class="strong">${esc(p.fullName)}</span> was employed with
        ${esc(sentence(p._branding?.legalName || p._startup?.name))} as
        <span class="strong">${esc(p.designation)}</span>.</p>

      <div class="section">Employment Record</div>
      <table class="kv">
        <tr><td class="k">Employee ID</td><td class="v">${esc(p.employeeCode)}</td></tr>
        <tr><td class="k">Designation</td><td class="v">${esc(p.designation)}</td></tr>
        ${p.department ? `<tr><td class="k">Department</td><td class="v">${esc(p.department)}</td></tr>` : ""}
        <tr><td class="k">Date of Joining</td><td class="v">${fmtDate(p.joinedAt)}</td></tr>
        <tr><td class="k">Date of Relieving</td><td class="v">${fmtDate(p.exitedAt)}</td></tr>
      </table>

      <p>During this tenure their conduct and performance were found to be
        <span class="strong">${esc(p.conduct ?? "satisfactory")}</span>. We thank them for their
        contribution and wish them success in their future endeavours.</p>

      ${signatures(p, false)}
    `
    ),

  LOR: (p) =>
    sheet(
      p,
      "Letter of Recommendation",
      `
      <p>To Whom It May Concern,</p>

      <p>I am pleased to recommend <span class="strong">${esc(p.fullName)}</span>, who worked with us at
        ${esc(sentence(p._branding?.legalName || p._startup?.name))} as
        <span class="strong">${esc(p.designation)}</span> from ${fmtDate(p.startDate)} to ${fmtDate(p.endDate)}.</p>

      <p>${esc(
        p.body ??
          "Throughout their time with us they consistently demonstrated strong ownership, technical ability and a collaborative approach to problem solving. They took feedback well, worked effectively with colleagues, and delivered what they committed to."
      )}</p>

      <p>I recommend them without reservation and would be glad to answer any further questions
        regarding their work with us.</p>

      ${signatures(p, false)}
    `
    ),

  CERTIFICATE: (p) =>
    sheet(
      p,
      `${p.certificateType ?? "Internship"} Completion Certificate`,
      `
      <p style="margin-top:6mm;">This is to certify that</p>
      <div class="recipient">${esc(p.fullName)}</div>
      ${p.college ? `<p style="color:#555; margin-top:0;">of ${esc(p.college)}</p>` : ""}

      <p style="margin-top:4mm;">has successfully completed
        ${p.durationMonths ? `a <span class="strong">${esc(p.durationMonths)}-month</span>` : "an"}
        ${esc(String(p.certificateType ?? "internship").toLowerCase())} as
        <span class="strong">${esc(p.designation)}</span> at
        ${esc(sentence(p._branding?.legalName || p._startup?.name))},
        from <span class="strong">${fmtDate(p.startDate)}</span> to
        <span class="strong">${fmtDate(p.endDate)}</span>.</p>

      <p>${esc(p.remarks ?? "We commend their dedication and contribution during this period, and wish them continued success.")}</p>

      ${signatures(p, false)}
    `,
      true
    ),

  RELIEVING: (p) =>
    sheet(
      p,
      "Relieving Letter",
      `
      <p>Dear <span class="strong">${esc(p.fullName)}</span>,</p>

      <p>This is to confirm that you have been relieved from your duties as
        <span class="strong">${esc(p.designation)}</span> at
        ${esc(sentence(p._branding?.legalName || p._startup?.name))}, effective
        <span class="strong">${fmtDate(p.exitedAt)}</span>.</p>

      <p>We confirm that all company property has been returned and your dues settled in full.
        We thank you for your service and wish you well in your future endeavours.</p>

      ${signatures(p, false)}
    `
    ),

  /* ID cards are a physical object at card stock size, not a letter. */
  ID_CARD: (p) => {
    const b = p._branding ?? {};
    return `<!doctype html><html><head><meta charset="utf-8">
<title>ID ${esc(p._documentNo)}</title>
<style>
  @page { size: 54mm 86mm; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; }
  .card { width: 54mm; height: 86mm; background: #fff; color: ${INK};
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 6mm 4mm 0; position: relative; }
  .bar { position: absolute; top: 0; left: 0; right: 0; height: 2mm; background: ${INK}; }
  .logo { max-height: 9mm; max-width: 30mm; object-fit: contain; margin-bottom: 3mm; }
  .photo { width: 23mm; height: 23mm; border-radius: 1mm; object-fit: cover;
           border: 0.5px solid ${RULE}; background: #F4F4F4; margin-bottom: 3mm; }
  .name { font-size: 10.5pt; font-weight: bold; line-height: 1.2; }
  .role { font-size: 7.5pt; color: ${MUTED}; margin-top: 1mm; }
  .code { font-size: 8pt; font-weight: bold; margin-top: 3mm; letter-spacing: 0.6px; }
  .meta { font-size: 6.5pt; color: ${FAINT}; margin-top: 1mm; }
  .foot { margin-top: auto; width: 100%; border-top: 0.5px solid ${RULE};
          padding: 2.5mm 0; font-size: 5.5pt; color: ${FAINT}; line-height: 1.5; }
  .foot b { display: block; font-size: 6pt; color: ${INK}; }
</style></head><body>
<div class="card">
  <div class="bar"></div>
  ${b.logoUrl ? `<img class="logo" src="${esc(b.logoUrl)}">` : `<div class="name" style="margin-bottom:3mm">${esc(p._startup?.name)}</div>`}
  <img class="photo" src="${esc(p.photoUrl ?? "")}" alt="">
  <div class="name">${esc(p.fullName)}</div>
  <div class="role">${esc(p.designation)}</div>
  <div class="code">${esc(p.employeeCode ?? p.internCode)}</div>
  ${p.bloodGroup ? `<div class="meta">Blood Group: ${esc(p.bloodGroup)}</div>` : ""}
  <div class="foot">
    <b>${esc(sentence(b.legalName || p._startup?.name))}</b>
    Part of the DevUp Ecosystem
  </div>
</div></body></html>`;
  },
};

export function renderDocument(key: TemplateKey, payload: Record<string, unknown>) {
  const tpl = TEMPLATES[key];
  if (!tpl) throw new Error(`Unknown template: ${key}`);
  return tpl(payload);
}
