import { LeadershipRole } from "@prisma/client";
import type { Stamps } from "./stamps";

/**
 * Deeds of appointment for the Lead DevUp directorate.
 *
 * These are the instruments that actually put someone in post across a state,
 * a region, a city or a campus, so they are drawn as deeds rather than as
 * letters: stamp-paper header, engraved border, recitals, numbered covenants,
 * a seal and a signature panel. A student pins this to a wall and shows it at
 * an interview — it has to look like the office it confers.
 *
 * One architecture across all four tiers, differentiated by crest, rank marks
 * and accent. Four unrelated designs would look like four unrelated
 * organisations; a series looks like an institution.
 */

export const INK = "#12151C";
export const MUTED = "#4A505C";
export const FAINT = "#8B929E";
export const RULE = "#C9CFD8";
export const PAPER = "#FCFBF7";

export interface TierStyle {
  /** How the office is written out on the deed. */
  label: string;
  /** Reference-number segment: DEVUP/LEAD/SD/2026-27/0001. */
  abbr: string;
  /** 1–4. Drawn as pips beside the crest; the higher office carries more. */
  rank: number;
  accent: string;
  accentSoft: string;
  /** Latin-style motto line under the crest. Fixed per tier. */
  motto: string;
  /** How the territory is described in the recital. */
  territory: (p: DeedParty) => string;
  /** What this tier is answerable for, beyond the common covenants. */
  duties: string[];
  /** Who they report to and who reports to them. */
  reporting: string;
  /** One line on what the office exists to do. Opens the handbook. */
  mission: string;
  /** The first thirty days, in order. */
  first30: string[];
  /** What the week looks like once they are running. */
  rhythm: string[];
  /** How often they report, and to whom. */
  cadence: string;
  /** The bar for a good quarter — concrete, so nobody has to guess. */
  bar: string[];
}

export interface DeedParty {
  fullName: string;
  state: string;
  city?: string | null;
  college?: string | null;
  jurisdiction: string;
}

/**
 * The territory phrase.
 *
 * Falls back up the hierarchy when the narrower field is blank — a city
 * director with no city recorded is still appointed over something, and a deed
 * that reads "for the city of" followed by nothing is worse than one that names
 * the state.
 */
const territoryOf = (p: DeedParty) => p.jurisdiction?.trim() || p.city || p.college || p.state;

export const TIERS: Record<LeadershipRole, TierStyle> = {
  STATE_DIRECTOR: {
    mission:
      "You are DevUp in your State. Where the ecosystem has a name in your State, you made it; " +
      "where it has none, that is the work.",
    cadence: "A written report to the Board on the first working day of each month.",
    first30: [
      "Read the deed you signed, end to end. The limits in clause 4 are the ones people forget.",
      "Meet your Regional and City Directors one to one. Ask each what is blocking them, and write it down.",
      "Map the State: every district, which colleges are active, which are dormant, which have nobody.",
      "Name the three districts you will open first, and say why in writing.",
      "Agree your quarterly targets with the Board rather than waiting to be given them.",
    ],
    rhythm: [
      "One call with your Regional Directors. Same slot every week, thirty minutes, agenda sent the day before.",
      "One conversation outside DevUp — a university, a state body, an industry group.",
      "Half a day in the field: a campus, an event, a meeting you did not have to attend.",
      "Clear anything your directors have escalated. Nothing waits a second week.",
    ],
    bar: [
      "Every district in the State has a named director or a named reason it does not.",
      "No City or Campus Director has gone a month without hearing from their chain.",
      "The State met its campus, participation and placement numbers, and you can show the workings.",
      "At least one institutional relationship opened that DevUp did not have a quarter ago.",
    ],
    label: "State Director",
    abbr: "SD",
    rank: 4,
    accent: "#6B1F2A",
    accentSoft: "#F3E7E9",
    motto: "Per Civitatem — Across the State",
    territory: (p) => `the State of ${territoryOf(p)}`,
    reporting:
      "The State Director reports to the Board of DevUp Ecosystem Private Limited, and holds " +
      "the Regional, City and Campus Directors within the State accountable for their charge.",
    duties: [
      "Hold and grow DevUp's presence across every district of the State, and be answerable for its standing there.",
      "Appoint, guide and review Regional, City and Campus Directors within the State, and recommend their confirmation or removal to the Board.",
      "Represent DevUp before universities, state technical bodies and government innovation cells within the State.",
      "Deliver the State's targets for campus reach, hackathon participation and internship placement each quarter.",
      "Report to the Board each month on the State's activity, its people and its obstacles.",
    ],
  },
  REGIONAL_DIRECTOR: {
    mission:
      "You hold the middle. The State sets direction and the campuses do the work; the Region is " +
      "where those two either meet or fail to.",
    cadence: "A written report to your State Director every second Monday.",
    first30: [
      "Read the deed you signed, end to end. The limits in clause 4 are the ones people forget.",
      "Meet every City and Campus Director in your Region. One to one, not a group call.",
      "List the cities in your Region and mark each: running, starting, or empty.",
      "Pick the two cities you will fix first, and tell your State Director which and why.",
      "Run or attend one DevUp event in the Region so you have seen the standard first-hand.",
    ],
    rhythm: [
      "One call with your City Directors. Same slot every week, agenda sent the day before.",
      "Check in with two Campus Directors directly — not through their City Director.",
      "Move one relationship forward: a college, a community, a company in the Region.",
      "Send your State Director anything you cannot solve, before it becomes their surprise.",
    ],
    bar: [
      "Every city in the Region has a director, or a written plan naming when it will.",
      "The Region ran its share of the quarter's events, on the published calendar.",
      "Campus onboarding and placement numbers were met, with the workings attached.",
      "No director under you left without an exit conversation and a successor named.",
    ],
    label: "Regional Director",
    abbr: "RD",
    rank: 3,
    accent: "#22306B",
    accentSoft: "#E6E9F4",
    motto: "Per Regionem — Across the Region",
    territory: (p) => `the Region of ${territoryOf(p)}`,
    reporting:
      "The Regional Director reports to the State Director, and holds the City and Campus " +
      "Directors within the Region accountable for their charge.",
    duties: [
      "Carry DevUp's programmes into every city of the Region and keep them running to standard.",
      "Guide and review the City and Campus Directors within the Region, and raise their names to the State Director for confirmation.",
      "Build the Region's relationships with colleges, industry bodies and local startup communities.",
      "Deliver the Region's targets for campus reach, event turnout and internship placement each quarter.",
      "Report to the State Director each fortnight on the Region's activity and its people.",
    ],
  },
  CITY_DIRECTOR: {
    mission:
      "You run DevUp in your city. If a student there has heard of us, it is because of something " +
      "you or your campus directors did.",
    cadence: "A written report to your Regional Director every second Monday.",
    first30: [
      "Read the deed you signed, end to end. The limits in clause 4 are the ones people forget.",
      "Meet every Campus Director in the city, and visit at least two campuses in person.",
      "List every college in the city and mark which have a director, which have none.",
      "Recruit for the two biggest campuses without one. Names to your Regional Director.",
      "Put one city-level event in the calendar inside your first six weeks.",
    ],
    rhythm: [
      "One call with your Campus Directors. Same slot every week, thirty minutes.",
      "Visit or call one campus that is going quiet before it goes silent.",
      "Move one city relationship forward: a college office, a community, a local company.",
      "Send your Regional Director the week in five lines. Numbers, blockers, wins.",
    ],
    bar: [
      "Every major college in the city has a Campus Director, or a named reason it does not.",
      "The city ran its meetups and hackathon rounds on the calendar, not late and not cancelled.",
      "Campus onboarding and placement numbers were met, with the workings attached.",
      "No campus went a full month without contact from you.",
    ],
    label: "City Director",
    abbr: "CD",
    rank: 2,
    accent: "#124A4A",
    accentSoft: "#E2EEEE",
    motto: "Per Urbem — Across the City",
    territory: (p) => `the City of ${territoryOf(p)}`,
    reporting:
      "The City Director reports to the Regional Director, and holds the Campus Directors " +
      "within the City accountable for their charge.",
    duties: [
      "Run DevUp's presence across the colleges of the City and be answerable for its reputation there.",
      "Recruit, guide and review the Campus Directors within the City.",
      "Convene city-level meetups, hackathon rounds and industry sessions on the published calendar.",
      "Deliver the City's targets for campus onboarding, event turnout and internship placement each quarter.",
      "Report to the Regional Director each fortnight on the City's activity and its people.",
    ],
  },
  CAMPUS_DIRECTOR: {
    mission:
      "You are the face of DevUp on your campus. To the students there, you are not a representative " +
      "of the ecosystem — you are the ecosystem.",
    cadence: "A written report to your City Director on the first Monday of each month.",
    first30: [
      "Read the deed you signed, end to end. The limits in clause 4 are the ones people forget.",
      "Introduce yourself to the placement or training and placement office. Do this in person.",
      "Build a team of three to five students who will actually turn up.",
      "Run one information session so the campus knows DevUp exists and who to ask.",
      "Send your City Director a one-page plan for the semester.",
    ],
    rhythm: [
      "One touchpoint with your campus team. Thirty minutes is enough if it is every week.",
      "Post or share one thing that is genuinely useful to students on your campus.",
      "Carry any opportunity that closes this month to the students it actually suits.",
      "Send your City Director the week in five lines. What ran, what did not, what you need.",
    ],
    bar: [
      "The campus ran its sessions and hackathon rounds without needing to be chased.",
      "Participation grew on the previous quarter, and you can say by how much.",
      "Students on your campus applied to DevUp opportunities and some were placed.",
      "The placement office knows your name and would take your call.",
    ],
    label: "Campus Director",
    abbr: "CPD",
    rank: 1,
    accent: "#6B4A18",
    accentSoft: "#F4EEE2",
    motto: "Per Collegium — Across the Campus",
    territory: (p) => `the campus of ${territoryOf(p)}`,
    reporting:
      "The Campus Director reports to the City Director, or in the absence of one, to the " +
      "Regional Director.",
    duties: [
      "Be DevUp's face on campus and the first person a student there can approach.",
      "Build and lead the campus team, and keep the community active through the academic year.",
      "Run campus rounds of DevUp hackathons, workshops and information sessions.",
      "Carry campus opportunities — internships, programmes and openings — to the students they suit.",
      "Report to the City Director each month on campus activity and participation.",
    ],
  },
};

export function esc(v: unknown) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** "01 Sep 2026" — the table is tight, and the long form wrapped in it. */
export const shortDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

/** "26th day of August, 2026" — the form a deed is written in. */
export function ordinalDate(d: Date) {
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${day}${suffix} day of ${d.toLocaleDateString("en-IN", { month: "long" })}, ${d.getFullYear()}`;
}

export interface AppointmentPayload {
  role: LeadershipRole;
  fullName: string;
  email: string;
  phone?: string | null;
  state: string;
  city?: string | null;
  college?: string | null;
  jurisdiction: string;
  documentNo: string;
  effectiveFrom: Date;
  effectiveTo: Date;
  termMonths: number;
  issuedAt: Date;
  /** Data URI. A remote crest that fails to load leaves a hole in the seal. */
  logo: string | null;
  org: { legalName: string; cin: string; address: string; email: string; site: string };
  directors: Array<{ name: string; title: string }>;
  /** Seals and signature stamps, as data URIs. */
  stamps: Stamps;
}

/** Kept as the old name so existing callers still compile. */
export type DeedPayload = AppointmentPayload;

/**
 * Rank pips beside the crest — four for a State Director down to one for a
 * Campus Director. A reader should be able to place the office across a room.
 */
export function pips(n: number, accent: string) {
  return Array.from({ length: 4 }, (_, i) =>
    i < n
      ? `<i style="background:${accent}"></i>`
      : `<i style="background:transparent;border:0.4px solid ${RULE}"></i>`
  ).join("");
}

/** The covenants every tier is bound by, in deed numbering. */
function covenants(t: TierStyle, p: AppointmentPayload) {
  const items: Array<[string, string]> = [
    [
      "Charge of Office",
      `The Appointee shall discharge the office of <b>${esc(t.label)}</b> for ${esc(
        t.territory(p)
      )}, faithfully and to the standard expected of a representative of the Company. ${esc(t.reporting)}`,
    ],
    [
      "Term",
      `This appointment takes effect on <b>${esc(fmtDate(p.effectiveFrom))}</b> and continues until ` +
        `<b>${esc(fmtDate(p.effectiveTo))}</b>, a term of ${p.termMonths} months, renewable by written ` +
        `instrument of the Company upon satisfactory review. The term ends automatically on the ` +
        `date stated unless so renewed.`,
    ],
    ["Duties", `<ol class="sub">${t.duties.map((d) => `<li>${esc(d)}</li>`).join("")}</ol>`],
    [
      "Authority and its Limits",
      `The Appointee may represent the Company within the territory named above and use the ` +
        `designation conferred by this deed. The Appointee shall <b>not</b> execute any contract, ` +
        `incur any liability, accept or promise any money, make any representation as to funding, ` +
        `employment or admission, or otherwise bind the Company in any manner, without the prior ` +
        `written authority of the Board. Any act beyond this clause is the Appointee's own and ` +
        `not the Company's.`,
    ],
    [
      "Nature of the Appointment",
      `This is an honorary leadership appointment. It does not create a contract of employment, ` +
        `and confers no salary, wage, retainer or entitlement to any employment benefit. Nothing ` +
        `in this deed constitutes a relationship of employer and employee, agency or partnership ` +
        `between the parties. Any stipend, honorarium or reimbursement, if extended, is at the ` +
        `Company's discretion and shall be recorded separately.`,
    ],
    [
      "Conduct and the Company's Name",
      `The Appointee shall uphold the good name of the Company, observe the laws of India and the ` +
        `rules of any institution within the territory, and refrain from any conduct — including ` +
        `any statement made publicly or online — that brings the Company into disrepute. The name, ` +
        `mark and materials of the Company are used only for the purposes of this office and only ` +
        `in the form the Company publishes.`,
    ],
    [
      "Confidentiality",
      `The Appointee shall keep confidential all non-public information of the Company and of any ` +
        `student, institution or partner that comes to their knowledge by reason of this office, ` +
        `both during the term and after it ends.`,
    ],
    [
      "Termination",
      `Either party may end this appointment by fourteen days' written notice. The Company may end ` +
        `it immediately for breach of any covenant of this deed, for misconduct, or for conduct ` +
        `prejudicial to its interests. Upon termination the Appointee shall cease all use of the ` +
        `Company's name, designation and materials, and return or destroy what is in their keeping.`,
    ],
    [
      "Governing Law",
      `This deed is governed by the laws of India, and the courts at Hyderabad, Telangana shall ` +
        `have exclusive jurisdiction over any matter arising from it.`,
    ],
  ];

  return items
    .map(
      ([head, text], i) => `<div class="cov">
      <div class="cov-h">${i + 1}. ${esc(head)}</div>
      <div class="cov-b">${text}</div>
    </div>`
    )
    .join("");
}

export function renderDeed(p: AppointmentPayload): string {
  const t = TIERS[p.role];
  const org = p.org;

  return `<!doctype html>
<html><head><meta charset="utf-8">
<title>Deed of Appointment — ${esc(t.label)} — ${esc(p.fullName)}</title>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; background: ${PAPER}; color: ${INK};
         font-family: Georgia, "Times New Roman", serif; font-size: 10pt; line-height: 1.62; }

  /* Every page is a real element that owns its own frame.
     Two other approaches were tried first. A position:fixed overlay is the
     usual advice for repeating page furniture, but Chrome painted it once and
     pages two and three came out bare. @page margins space the text correctly
     but give nothing to draw a border on. So the content is paginated below,
     in the document, and each page carries its own copy of the frame. */
  @page { size: A4; margin: 0; }
  .page { position: relative; width: 210mm; height: 297mm; overflow: hidden;
          background: ${PAPER}; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .frame { position: absolute; inset: 0; padding: 9mm; z-index: 0; }
  .paper { position: relative; z-index: 1; height: 100%;
           padding: 20mm 22mm 18mm; overflow: hidden;
           /* A column so the foot can be pushed to the bottom of whichever
              page it lands on. Left in normal flow it sat directly under the
              signatures, halfway up an otherwise empty last page. */
           display: flex; flex-direction: column; }
  .paper > * { flex-shrink: 0; }
  .frame-outer { width: 100%; height: 100%; border: 2.6px solid ${t.accent};
                 padding: 1.4mm; }
  .frame-mid { width: 100%; height: 100%; border: 0.6px solid ${t.accent};
               padding: 1.2mm;
               /* Engine-turned edge: a fine repeating rule is what separates a
                  bond certificate from a box drawn round a page. */
               background:
                 repeating-linear-gradient(45deg, ${t.accentSoft} 0 1.1mm, transparent 1.1mm 2.2mm); }
  .frame-inner { width: 100%; height: 100%; border: 0.6px solid ${t.accent};
                 background: ${PAPER}; }

  /* Corner rosettes, drawn as concentric rings. */
  .rosette { position: absolute; width: 11mm; height: 11mm; border-radius: 50%;
             border: 0.6px solid ${t.accent};
             background: radial-gradient(circle, ${t.accentSoft} 0 22%, transparent 22% 46%,
                         ${t.accentSoft} 46% 54%, transparent 54%); }
  .r-tl { top: 5.6mm; left: 5.6mm; } .r-tr { top: 5.6mm; right: 5.6mm; }
  .r-bl { bottom: 5.6mm; left: 5.6mm; } .r-br { bottom: 5.6mm; right: 5.6mm; }

  .watermark { position: absolute; top: 50%; left: 50%;
               transform: translate(-50%, -50%) rotate(-24deg);
               font-size: 62pt; letter-spacing: 10px; font-weight: bold; color: ${t.accent};
               opacity: 0.045; white-space: nowrap; z-index: 0; }

  /* ── Stamp-paper head ────────────────────────────────────────────────── */
  .stamp-strip { display: flex; justify-content: space-between; align-items: stretch;
                 border: 0.6px solid ${t.accent}; background: ${t.accentSoft};
                 font-family: Arial, Helvetica, sans-serif; font-size: 6.4pt;
                 letter-spacing: 1.5px; text-transform: uppercase; color: ${t.accent};
                 padding: 1.6mm 3mm; margin-bottom: 7mm; }
  .stamp-strip b { font-weight: bold; letter-spacing: 1.9px; }

  .head { text-align: center; }
  .crest-row { display: flex; align-items: center; justify-content: center; gap: 4mm; }
  .crest { height: 15mm; width: auto; object-fit: contain; }
  .pips { display: flex; flex-direction: column; gap: 1.1mm; }
  .pips i { display: block; width: 2.1mm; height: 2.1mm; transform: rotate(45deg); }

  .org { font-size: 14pt; font-weight: bold; letter-spacing: 2.6px;
         text-transform: uppercase; margin-top: 4mm; line-height: 1.15; }
  .org-sub { font-family: Arial, Helvetica, sans-serif; font-size: 6.4pt; color: ${MUTED};
             letter-spacing: 2.2px; text-transform: uppercase; margin-top: 1.6mm; }

  .divider { display: flex; align-items: center; justify-content: center; gap: 2.6mm;
             margin: 5mm auto 4mm; width: 76mm; }
  .divider i { flex: 1; height: 0.5px; background: ${t.accent}; opacity: 0.5; }
  .divider b { width: 2.4mm; height: 2.4mm; background: ${t.accent}; transform: rotate(45deg); }

  .deed-title { font-size: 17pt; font-weight: bold; letter-spacing: 4.5px;
                text-transform: uppercase; color: ${t.accent}; }
  /* A ribbon rather than a plain subtitle: the office is the point of the page. */
  .ribbon { display: inline-block; margin-top: 3.4mm; padding: 1.7mm 9mm;
            background: ${t.accent}; color: #FFFFFF;
            font-family: Arial, Helvetica, sans-serif; font-size: 8.6pt;
            letter-spacing: 3.4px; text-transform: uppercase; font-weight: bold; }
  .motto { font-style: italic; font-size: 8pt; color: ${MUTED}; margin-top: 3mm;
           letter-spacing: 0.4px; }

  /* ── Particulars ─────────────────────────────────────────────────────── */
  .presents { margin-top: 8mm; font-size: 9pt; letter-spacing: 2.4px;
              text-transform: uppercase; color: ${MUTED};
              font-family: Arial, Helvetica, sans-serif; text-align: center; }
  .recital { margin-top: 4mm; text-align: justify; }
  .recital .who { font-size: 13pt; font-weight: bold; letter-spacing: 0.6px; }

  .particulars { margin: 6mm 0 0; border: 0.6px solid ${RULE}; border-collapse: collapse;
                 width: 100%; font-size: 9pt; table-layout: fixed; }
  .particulars td { border: 0.5px solid ${RULE}; padding: 2mm 3mm; vertical-align: top; }
  .particulars td.k { width: 23mm; color: ${MUTED}; background: #F7F6F2;
                      font-family: Arial, Helvetica, sans-serif; font-size: 7.4pt;
                      letter-spacing: 0.9px; text-transform: uppercase; }
  .particulars td.v { font-weight: bold; }
  /* The instrument number is one long slash-separated token; at the body
     size it wrapped inside its cell. */
  .particulars td.v.ref { font-size: 7.9pt; letter-spacing: 0; }

  /* ── Covenants ───────────────────────────────────────────────────────── */
  .cov-head { margin: 8mm 0 3mm; font-family: Arial, Helvetica, sans-serif; font-size: 7.6pt;
              letter-spacing: 2.6px; text-transform: uppercase; color: ${t.accent};
              border-bottom: 0.6px solid ${t.accent}; padding-bottom: 1.6mm; }
  .cov { margin-bottom: 3.6mm; page-break-inside: avoid; break-inside: avoid; }
  .cov-h { font-weight: bold; font-size: 10pt; margin-bottom: 1mm; }
  .cov-b { text-align: justify; }
  ol.sub { margin: 1mm 0 0; padding-left: 6mm; }
  ol.sub li { margin-bottom: 1.2mm; text-align: justify; }

  /* ── Execution ───────────────────────────────────────────────────────── */
  .execution { margin-top: 9mm; page-break-inside: avoid; break-inside: avoid;
               padding-bottom: 4mm; }
  .in-witness { text-align: justify; font-style: italic; color: ${MUTED}; font-size: 9pt; }

  .exec-grid { display: flex; gap: 8mm; margin-top: 7mm; align-items: flex-start; }
  .exec-col { flex: 1; }
  .exec-cap { font-family: Arial, Helvetica, sans-serif; font-size: 6.8pt; color: ${MUTED};
              letter-spacing: 1.6px; text-transform: uppercase; margin-bottom: 3mm; }
  /* Where no stamp is inked, the space for a wet signature has to stay. */
  .exec-cap.blank { margin-bottom: 12mm; }
  .sign-row { display: flex; gap: 5mm; }
  .sign-cell { flex: 1; min-width: 0; }
  .sign-line { border-top: 0.9px solid ${INK}; padding-top: 1.6mm; }
  .sign-name { font-size: 8.4pt; font-weight: bold; line-height: 1.35; }
  .sign-role { font-size: 7.4pt; color: ${MUTED}; }

  /* Seal and revenue stamp sit together: on a real instrument they always do. */
  .marks { display: flex; flex-direction: column; align-items: center; gap: 3mm;
           width: 42mm; flex-shrink: 0; }
  .seal-img { width: 32mm; height: auto; }
  /* The signature stamp is inked over the rule the way a real one is — pulled
     up so it sits across the line rather than politely beneath it. */
  .sign-stamp { width: 46mm; height: auto; margin: -3mm 0 0 -2mm; }
  .revenue { width: 30mm; height: 20mm; border: 0.5px dashed ${FAINT};
             display: flex; align-items: center; justify-content: center; text-align: center;
             font-family: Arial, Helvetica, sans-serif; font-size: 5.4pt; color: ${FAINT};
             letter-spacing: 1.1px; text-transform: uppercase; line-height: 1.6; }

  /* ── Foot ────────────────────────────────────────────────────────────── */
  .foot { margin-top: auto; padding-top: 2.4mm; border-top: 0.6px solid ${RULE};
          font-family: Arial, Helvetica, sans-serif; font-size: 6.3pt; color: ${FAINT};
          text-align: center; line-height: 1.65; }
  .foot b { color: ${MUTED}; font-weight: normal; }
  /* Microtext: on bond paper a line this fine is what stops a photocopy passing
     as the original. It is meant to be almost unreadable. */
  .microtext { margin-top: 2mm; font-size: 3.4pt; letter-spacing: 0.5px;
               color: ${RULE}; word-break: break-all; line-height: 1.2; }
</style></head>
<body>

<!-- Stamped into every page by the paginator below. -->
<template id="frame-tpl">
  <div class="frame">
    <div class="frame-outer"><div class="frame-mid"><div class="frame-inner"></div></div></div>
    <span class="rosette r-tl"></span><span class="rosette r-tr"></span>
    <span class="rosette r-bl"></span><span class="rosette r-br"></span>
  </div>
  <div class="watermark">DEVUP</div>
</template>

<div id="pages"></div>
<div id="flow">

  <div class="stamp-strip">
    <span>Instrument No. <b>${esc(p.documentNo)}</b></span>
    <span>Series <b>Lead DevUp &middot; ${esc(t.abbr)}</b></span>
    <span>Issued <b>${esc(fmtDate(p.issuedAt))}</b></span>
  </div>

  <div class="head">
    <div class="crest-row">
      <div class="pips">${pips(t.rank, t.accent)}</div>
      ${p.logo ? `<img class="crest" src="${p.logo}" alt="">` : ""}
      <div class="pips">${pips(t.rank, t.accent)}</div>
    </div>
    <div class="org">${esc(org.legalName)}</div>
    <div class="org-sub">CIN ${esc(org.cin)} &middot; ${esc(org.site)}</div>

    <div class="divider"><i></i><b></b><i></i></div>

    <div class="deed-title">Deed of Appointment</div>
    <div class="ribbon">${esc(t.label)}</div>
    <div class="motto">${esc(t.motto)}</div>
  </div>

  <div class="presents">Know all persons by these presents</div>

  <div class="recital">
    That <span class="who">${esc(p.fullName)}</span> is hereby appointed by
    ${esc(org.legalName)} to the office of <b>${esc(t.label)}</b> for ${esc(t.territory(p))},
    under the Lead DevUp programme, on this ${esc(ordinalDate(p.issuedAt))}, to hold the said
    office upon the covenants written below, which the Appointee accepts by signing this deed.
  </div>

  <table class="particulars">
    <tr><td class="k">Appointee</td><td class="v">${esc(p.fullName)}</td>
        <td class="k">Office</td><td class="v">${esc(t.label)}</td></tr>
    <tr><td class="k">Territory</td><td class="v">${esc(p.jurisdiction)}</td>
        <td class="k">State</td><td class="v">${esc(p.state)}</td></tr>
    <tr><td class="k">Institution</td><td class="v">${esc(p.college || "—")}</td>
        <td class="k">City</td><td class="v">${esc(p.city || "—")}</td></tr>
    <tr><td class="k">Term</td><td class="v ref">${esc(shortDate(p.effectiveFrom))} &ndash; ${esc(shortDate(p.effectiveTo))}</td>
        <td class="k">Instrument</td><td class="v ref">${esc(p.documentNo)}</td></tr>
  </table>

  <div class="cov-head">Covenants of this appointment</div>
  ${covenants(t, p)}

  <div class="execution">
    <div class="in-witness">
      In witness whereof the Company has caused this deed to be executed by its authorised
      signatory, and the Appointee has set their hand hereunder in acceptance of the office and of
      every covenant above.
    </div>

    <div class="exec-grid">
      <div class="exec-col">
        <div class="exec-cap${p.stamps.authorisedSign ? "" : " blank"}">For and on behalf of ${esc(org.legalName)}</div>
        ${p.stamps.authorisedSign ? `<img class="sign-stamp" src="${p.stamps.authorisedSign}" alt="">` : ""}
        <div class="sign-row">
          <div class="sign-cell" style="max-width:62mm">
            <div class="sign-line">
              <div class="sign-role">Authorised Signatory</div>
            </div>
          </div>
        </div>

        <div class="exec-cap blank" style="margin-top:9mm">Accepted by the Appointee</div>
        <div class="sign-row" style="max-width:62mm">
          <div class="sign-cell">
            <div class="sign-line">
              <div class="sign-name">${esc(p.fullName)}</div>
              <div class="sign-role">${esc(t.label)} &middot; ${esc(p.jurisdiction)}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="marks">
        ${p.stamps.officialSeal ? `<img class="seal-img" src="${p.stamps.officialSeal}" alt="Common Seal">` : ""}
        <div class="revenue">Affix<br>Revenue<br>Stamp</div>
      </div>
    </div>
  </div>

  <div class="foot">
    ${esc(org.legalName)} &middot; CIN ${esc(org.cin)} &middot; ${esc(org.address)}<br>
    Verify this instrument at <b>${esc(org.site)}</b> quoting <b>${esc(p.documentNo)}</b>
    <div class="microtext">${`DEVUPECOSYSTEM&middot;${esc(p.documentNo)}&middot;`.repeat(14)}</div>
  </div>

</div>

<script>
/**
 * Lays the deed out into A4 pages.
 *
 * Runs in the browser for the preview and inside Chromium for the PDF, so both
 * see identical pagination. Blocks are moved one at a time into the current
 * page; the moment one overflows, it is pulled back out and starts the next
 * page. Nothing is split mid-block, which is why the covenants are emitted as
 * siblings rather than as one list.
 */
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
    if (body.scrollHeight > body.clientHeight) {
      // A block taller than a whole page has nowhere better to go, so it stays
      // and is allowed to clip rather than spinning up empty pages forever.
      if (body.childNodes.length > 1) {
        body.removeChild(block);
        body = newPage();
        body.appendChild(block);
      }
    }
  }
  flow.parentNode.removeChild(flow);
})();
</script>

</body></html>`;
}
