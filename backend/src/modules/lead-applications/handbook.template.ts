import {
  TIERS, AppointmentPayload, esc, fmtDate,
  INK, MUTED, FAINT, RULE, PAPER,
} from "./appointmentTemplates";

/**
 * The directorate handbook.
 *
 * The deed says what the office is; this says how to hold it. Written as
 * instructions to one person rather than as policy, because the reader is a
 * student who has just been given a title and a territory and no idea what
 * Monday looks like.
 *
 * Framed like the other two so the three arrive as one set, but drawn lighter:
 * this is meant to be read at a desk and marked up, not signed and filed.
 */

/** Each section is a heading, an optional lead line, and a list. */
interface Section {
  n: number;
  title: string;
  lead?: string;
  items?: string[];
  body?: string;
}

function sections(p: AppointmentPayload): Section[] {
  const t = TIERS[p.role];
  return [
    {
      n: 1,
      title: "What this office is for",
      body:
        `${esc(t.mission)}<br><br>${esc(t.reporting)} The territory you hold is ` +
        `<b>${esc(p.jurisdiction)}</b>, and the term runs to ${esc(fmtDate(p.effectiveTo))}.`,
    },
    {
      n: 2,
      title: "Your first thirty days",
      lead: "In this order. Most of what goes wrong later is one of these skipped early.",
      items: t.first30,
    },
    {
      n: 3,
      title: "The week, once you are running",
      lead:
        "Four things. They take a few hours in total, and doing them every week is the whole " +
        "difference between a territory that works and one that has a director.",
      items: t.rhythm,
    },
    {
      n: 4,
      title: "Reporting",
      body:
        `${esc(t.cadence)}<br><br>Keep it to five lines: what ran, the numbers, what is blocked, ` +
        `what you need, and what is coming. Nobody wants a long report and nobody reads one. ` +
        `Send it whether or not the news is good — a quiet month reported is information; a quiet ` +
        `month unreported is a problem discovered late.`,
    },
    {
      n: 5,
      title: "What a good quarter looks like",
      lead: "You are reviewed against these. There is no hidden list.",
      items: t.bar,
    },
    {
      n: 6,
      title: "Running an event",
      lead: "The same sequence every time. It is short because most of the failures are the same three.",
      items: [
        "Fix the date and the room before you announce anything. An announced event without a room is how a campus stops believing you.",
        "Announce it at least ten days out, and again three days out. Once is not an announcement.",
        "Confirm your speakers the day before. Confirm, not remind.",
        "Take attendance and take photographs. Both are asked for later and neither can be recreated.",
        "Send the numbers and two photos up your chain within twenty-four hours, while they exist.",
      ],
    },
    {
      n: 7,
      title: "Speaking for DevUp",
      lead:
        "You carry the Company's name. Clause 4 of your deed sets the limits; in practice they come " +
        "down to these.",
      items: [
        "You may describe DevUp's programmes, invite people into them, and speak about what you run.",
        "You may not promise anyone an internship, a placement, admission, funding or payment. Not conditionally, not informally.",
        "You may not sign anything, agree to any cost, or accept money on the Company's behalf.",
        "Use the logo and the templates as published. Do not redraw them, recolour them, or make your own.",
        "If a college, a company or the press asks for something in writing, send it up your chain first.",
      ],
    },
    {
      n: 8,
      title: "When something goes wrong",
      lead:
        "It will. What matters is how quickly it travels upward — almost nothing is unrecoverable in " +
        "the first day, and most things are by the second week.",
      items: [
        "An event about to fail, a college withdrawing, a director going silent: escalate the same day.",
        "Anything involving a student's safety, harassment, or money: escalate immediately and directly to the Board, not through your chain.",
        "A mistake you made: report it yourself. It is always smaller when you are the one saying it.",
        "If you cannot continue in the office, say so early enough to hand over properly. That is respected; disappearing is not.",
      ],
    },
    {
      n: 9,
      title: "Standing down",
      body:
        "Your term ends on the date in the deed unless it is renewed in writing. If you step down " +
        "before then, give fourteen days' notice, name a successor if you can, and hand over your " +
        "contacts, calendar and campus relationships. On the last day, stop using the designation " +
        "and the Company's marks. Your certificate remains yours — the office does not.",
    },
  ];
}

export function renderHandbook(p: AppointmentPayload): string {
  const t = TIERS[p.role];
  const org = p.org;

  const blocks = sections(p)
    .map(
      (s) => `<div class="sec">
      <div class="sec-h"><span class="sec-n">${s.n}</span>${esc(s.title)}</div>
      ${s.lead ? `<div class="sec-lead">${esc(s.lead)}</div>` : ""}
      ${s.body ? `<div class="sec-body">${s.body}</div>` : ""}
      ${
        s.items
          ? `<ul class="sec-list">${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
          : ""
      }
    </div>`
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8">
<title>Directorate Handbook — ${esc(t.label)} — ${esc(p.fullName)}</title>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; background: ${PAPER}; color: ${INK};
         font-family: Georgia, "Times New Roman", serif; font-size: 10pt; line-height: 1.62; }

  /* Paginated the same way as the deed: each page is a real element carrying
     its own frame, because a fixed overlay paints once and leaves later pages
     bare. Drawn as a single rule here rather than the deed's triple border —
     this is a working document, not an instrument. */
  @page { size: A4; margin: 0; }
  .page { position: relative; width: 210mm; height: 297mm; overflow: hidden;
          background: ${PAPER}; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .frame { position: absolute; inset: 0; padding: 10mm; }
  .frame-inner { width: 100%; height: 100%; border: 0.8px solid ${t.accent};
                 border-top: 4px solid ${t.accent}; }
  .paper { position: relative; z-index: 1; height: 100%;
           padding: 22mm 24mm 18mm; overflow: hidden;
           display: flex; flex-direction: column; }
  .paper > * { flex-shrink: 0; }

  /* ── Masthead, first page only ─────────────────────────────────────── */
  .masthead { border-bottom: 0.8px solid ${RULE}; padding-bottom: 6mm; margin-bottom: 7mm; }
  .mast-row { display: flex; align-items: center; gap: 4mm; }
  .crest { height: 13mm; width: auto; object-fit: contain; }
  .mast-org { font-size: 11.5pt; font-weight: bold; letter-spacing: 1.6px;
              text-transform: uppercase; line-height: 1.2; }
  .mast-sub { font-family: Arial, Helvetica, sans-serif; font-size: 6.4pt; color: ${MUTED};
              letter-spacing: 2.2px; text-transform: uppercase; margin-top: 1.2mm; }

  .hb-title { font-size: 20pt; font-weight: bold; letter-spacing: 1.4px;
              color: ${t.accent}; margin-top: 7mm; line-height: 1.15; }
  .hb-for { font-size: 10pt; color: ${MUTED}; margin-top: 2.5mm; }
  .hb-for b { color: ${INK}; }

  .hb-meta { display: flex; gap: 3mm; margin-top: 5mm; }
  .chip { border: 0.5px solid ${RULE}; background: #FFFFFF; padding: 1.6mm 3.4mm; }
  .chip .k { font-family: Arial, Helvetica, sans-serif; font-size: 6pt; color: ${FAINT};
             letter-spacing: 1.3px; text-transform: uppercase; display: block; }
  .chip .v { font-size: 9pt; font-weight: bold; white-space: nowrap; }
  /* The instrument number is the long one; sized so all four chips sit on
     one row rather than orphaning it onto a second. */
  .chip .v.ref { font-size: 7.4pt; letter-spacing: 0; }

  .preamble { margin: 6mm 0 6mm; padding: 4mm 5mm; background: ${t.accentSoft};
              border-left: 2.4px solid ${t.accent}; font-size: 9.6pt; text-align: justify; }

  /* ── Sections ──────────────────────────────────────────────────────── */
  .sec { margin-bottom: 6mm; page-break-inside: avoid; break-inside: avoid; }
  .sec-h { display: flex; align-items: baseline; gap: 3.4mm; font-size: 12pt;
           font-weight: bold; color: ${t.accent}; margin-bottom: 2mm;
           border-bottom: 0.5px solid ${RULE}; padding-bottom: 1.6mm; }
  .sec-n { display: inline-flex; align-items: center; justify-content: center;
           width: 6.4mm; height: 6.4mm; flex-shrink: 0; background: ${t.accent};
           color: #FFFFFF; font-family: Arial, Helvetica, sans-serif; font-size: 8pt;
           border-radius: 50%; }
  .sec-lead { color: ${MUTED}; font-style: italic; margin-bottom: 2mm; text-align: justify; }
  .sec-body { text-align: justify; }
  .sec-list { margin: 0; padding-left: 6mm; }
  .sec-list li { margin-bottom: 1.8mm; text-align: justify; }
  .sec-list li::marker { color: ${t.accent}; }

  /* ── Sign-off ──────────────────────────────────────────────────────── */
  .signoff { margin-top: 4mm; padding-top: 5mm; border-top: 0.8px solid ${RULE};
             display: flex; align-items: flex-end; justify-content: space-between; gap: 8mm;
             page-break-inside: avoid; break-inside: avoid; }
  .signoff-t { flex: 1; }
  .signoff-t p { margin: 0 0 2mm; text-align: justify; }
  .signoff-who { font-size: 9pt; color: ${MUTED}; margin-top: 4mm; }
  .signoff-who b { color: ${INK}; }
  .ink { width: 34mm; height: auto; flex-shrink: 0; opacity: 0.92; }

  .foot { margin-top: auto; padding-top: 2.4mm; border-top: 0.5px solid ${RULE};
          font-family: Arial, Helvetica, sans-serif; font-size: 6.3pt; color: ${FAINT};
          display: flex; justify-content: space-between; gap: 6mm; }
</style></head>
<body>

<template id="frame-tpl">
  <div class="frame"><div class="frame-inner"></div></div>
</template>

<div id="pages"></div>
<div id="flow">

  <div class="masthead">
    <div class="mast-row">
      ${p.logo ? `<img class="crest" src="${p.logo}" alt="">` : ""}
      <div>
        <div class="mast-org">${esc(org.legalName)}</div>
        <div class="mast-sub">Lead DevUp Directorate &middot; ${esc(org.site)}</div>
      </div>
    </div>

    <div class="hb-title">Directorate Handbook</div>
    <div class="hb-for">
      Prepared for <b>${esc(p.fullName)}</b>, ${esc(t.label)} for <b>${esc(p.jurisdiction)}</b>
    </div>

    <div class="hb-meta">
      <span class="chip"><span class="k">Office</span><span class="v">${esc(t.label)}</span></span>
      <span class="chip"><span class="k">Territory</span><span class="v">${esc(p.jurisdiction)}</span></span>
      <span class="chip"><span class="k">Term to</span><span class="v">${esc(fmtDate(p.effectiveTo))}</span></span>
      <span class="chip"><span class="k">Instrument</span><span class="v ref">${esc(p.documentNo)}</span></span>
    </div>
  </div>

  <div class="preamble">
    Read this once now and again at the end of your first month. It is short on purpose. Nothing
    here overrides your deed of appointment — where the two differ, the deed governs — but almost
    every question you are about to have is answered somewhere below.
  </div>

  ${blocks}

  <div class="signoff">
    <div class="signoff-t">
      <p>
        You were given this office because someone believed you would do something with it. The
        territory is yours to make something of; the only thing asked in return is that you keep
        your chain informed and do not let it go quiet.
      </p>
      <div class="signoff-who">
        Issued for <b>${esc(org.legalName)}</b><br>
        ${p.directors.map((d) => `${esc(d.name)} &mdash; ${esc(d.title)}`).join("<br>")}
      </div>
    </div>
    ${p.stamps.inkStamp ? `<img class="ink" src="${p.stamps.inkStamp}" alt="">` : ""}
  </div>

  <div class="foot">
    <span>${esc(org.legalName)} &middot; CIN ${esc(org.cin)}</span>
    <span>${esc(p.documentNo)} &middot; Handbook</span>
  </div>

</div>

<script>
/** Same paginator as the deed: blocks move into a page until one overflows. */
(function () {
  var flow = document.getElementById('flow');
  var host = document.getElementById('pages');
  var tpl = document.getElementById('frame-tpl');
  if (!flow || !host || !tpl) return;

  function newPage() {
    var page = document.createElement('div');
    page.className = 'page';
    page.appendChild(tpl.content.cloneNode(true));
    var body = document.createElement('div');
    body.className = 'paper';
    page.appendChild(body);
    host.appendChild(page);
    return body;
  }

  var body = newPage();
  var blocks = Array.prototype.slice.call(flow.children);
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    body.appendChild(block);
    if (body.scrollHeight > body.clientHeight && body.childNodes.length > 1) {
      body.removeChild(block);
      body = newPage();
      body.appendChild(block);
    }
  }
  flow.parentNode.removeChild(flow);
})();
</script>

</body></html>`;
}
