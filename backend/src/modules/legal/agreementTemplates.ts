import type { AgreementType } from "@prisma/client";

/**
 * Starter content per agreement type.
 *
 * These are drafting aids, not finished contracts: the admin edits them before
 * anything is issued, and every one leaves the commercial terms as an explicit
 * blank rather than inventing a number. A template that quietly fills in a
 * duration or a fee is worse than an empty page, because nobody re-reads the
 * part they did not write.
 */

export interface AgreementTemplate {
  /** Printed as the document title. */
  title: string;
  /** The line under it. */
  subtitle: string;
  /** Short label for the admin picker. */
  label: string;
  blurb: string;
  /** Abbreviation in the reference number: DEVUP/MOU/2026-27/0001. */
  abbr: string;
  bodyHtml: string;
}

const RECITALS = (what: string) => `
<h2>1. Purpose</h2>
<p>${what}</p>

<h2>2. Scope of Collaboration</h2>
<ul>
  <li>&nbsp;</li>
  <li>&nbsp;</li>
</ul>

<h2>3. Responsibilities</h2>
<h3>3.1 DevUp Ecosystem Pvt Ltd shall:</h3>
<ul><li>&nbsp;</li></ul>
<h3>3.2 The Second Party shall:</h3>
<ul><li>&nbsp;</li></ul>

<h2>4. Term</h2>
<p>This Memorandum shall take effect on the Effective Date stated above and
remain in force until the Expiry Date, unless extended in writing by both
Parties or terminated in accordance with Clause 6.</p>

<h2>5. Confidentiality</h2>
<p>Each Party shall keep confidential all non-public information disclosed by
the other in connection with this Memorandum, and shall not disclose it to any
third party without prior written consent. This obligation survives the
termination of this Memorandum.</p>

<h2>6. Termination</h2>
<p>Either Party may terminate this Memorandum by giving thirty (30) days written
notice to the other. Obligations accrued before the date of termination remain
unaffected.</p>

<h2>7. No Financial Obligation</h2>
<p>Unless expressly recorded in writing, nothing in this Memorandum creates any
financial liability, partnership, joint venture, or employment relationship
between the Parties.</p>

<h2>8. Governing Law</h2>
<p>This Memorandum shall be governed by the laws of India, and the courts at
Hyderabad, Telangana shall have exclusive jurisdiction.</p>
`;

export const AGREEMENT_TEMPLATES: Record<AgreementType, AgreementTemplate> = {
  B2B: {
    label: "B2B Agreement",
    blurb: "Commercial arrangement with another company — services, referrals or resale.",
    title: "Memorandum of Understanding",
    subtitle: "Business-to-Business Collaboration",
    abbr: "B2B",
    bodyHtml: RECITALS(
      "The Parties wish to explore and undertake a commercial collaboration for " +
        "the supply of services, referral of customers, or joint delivery of work, " +
        "on the terms recorded below."
    ),
  },

  COLLABORATOR: {
    label: "Collaborator MOU",
    blurb: "An institution, community or individual working alongside DevUp on shared initiatives.",
    title: "Memorandum of Understanding",
    subtitle: "Collaboration",
    abbr: "COL",
    bodyHtml: RECITALS(
      "The Parties wish to collaborate on initiatives of mutual interest, including " +
        "events, programmes, mentorship and the exchange of expertise, on the terms " +
        "recorded below."
    ),
  },

  PARTNER: {
    label: "Ecosystem Partner MOU",
    blurb: "An organisation formally recognised as a DevUp ecosystem partner.",
    title: "Memorandum of Understanding",
    subtitle: "Official Startup Ecosystem Partnership",
    abbr: "PTR",
    bodyHtml: RECITALS(
      "The Parties wish to record the terms on which the Second Party is recognised " +
        "as an Official Startup Ecosystem Partner of DevUp Ecosystem Pvt Ltd, and the " +
        "benefits and obligations that recognition carries."
    ),
  },

  INCUBATION: {
    label: "Incubation Agreement",
    blurb: "A startup taken into the DevUp incubation programme.",
    title: "Incubation Agreement",
    subtitle: "Startup Incubation Programme",
    abbr: "INC",
    bodyHtml: `
<h2>1. Purpose</h2>
<p>DevUp Ecosystem Pvt Ltd agrees to admit the Second Party into its incubation
programme, and to provide the support set out below for the duration of the
Term.</p>

<h2>2. Support Provided</h2>
<ul>
  <li>Workspace and infrastructure, as available</li>
  <li>Mentorship and advisory support</li>
  <li>Access to the DevUp network of partners, investors and talent</li>
  <li>&nbsp;</li>
</ul>

<h2>3. Obligations of the Startup</h2>
<ul>
  <li>Participate in review sessions and report progress as reasonably requested</li>
  <li>Use the support provided solely for the business described in its application</li>
  <li>&nbsp;</li>
</ul>

<h2>4. Term</h2>
<p>The incubation period runs from the Effective Date to the Expiry Date stated
above, and may be extended by written agreement.</p>

<h2>5. Equity and Fees</h2>
<p>&nbsp;</p>

<h2>6. Intellectual Property</h2>
<p>Each Party retains ownership of intellectual property it owned before this
Agreement, and of anything it creates independently of it. Nothing here
transfers ownership of the Second Party's intellectual property to DevUp
Ecosystem Pvt Ltd.</p>

<h2>7. Confidentiality</h2>
<p>Each Party shall keep confidential all non-public information disclosed by the
other, and shall not disclose it to any third party without prior written
consent. This obligation survives termination.</p>

<h2>8. Termination</h2>
<p>Either Party may terminate this Agreement by giving thirty (30) days written
notice. On termination the Second Party shall vacate any workspace provided and
return any DevUp property in its possession.</p>

<h2>9. Governing Law</h2>
<p>This Agreement shall be governed by the laws of India, and the courts at
Hyderabad, Telangana shall have exclusive jurisdiction.</p>
`,
  },

  /**
   * A plain letter. No agreement, no parties, no counter-signature.
   *
   * The one people actually reach for most days — an invitation, a note to a
   * college, a request for a venue. Everything else here starts from a set of
   * clauses; this starts from nothing but the letterhead, because the whole
   * point is that the writer supplies the words.
   */
  LETTER: {
    label: "Letter",
    blurb: "A plain letter on the letterhead. No clauses, no signatures from the other side — paste your own words.",
    title: "",
    subtitle: "",
    abbr: "LTR",
    bodyHtml: `
<p>To,</p>

<p>&nbsp;</p>

<p><b>Subject:</b> &nbsp;</p>

<p>Dear Sir/Madam,</p>

<p>&nbsp;</p>

<p>Yours sincerely,</p>
`,
  },

  SUPPORT: {
    label: "Letter of Support",
    blurb: "A short letter backing an application, event or initiative. Not a contract.",
    title: "Letter of Support",
    subtitle: "",
    abbr: "SUP",
    bodyHtml: `
<p>To Whom It May Concern,</p>

<p>DevUp Ecosystem Pvt Ltd is pleased to extend its support to the above-named
party in respect of &nbsp;.</p>

<p>&nbsp;</p>

<p>We are satisfied as to the merit of this initiative and are willing to
contribute in the following ways:</p>

<ul>
  <li>&nbsp;</li>
  <li>&nbsp;</li>
</ul>

<p>This letter is issued on request and does not by itself create any financial
or contractual obligation on the part of DevUp Ecosystem Pvt Ltd.</p>

<p>Should any further information be required, we would be glad to provide it.</p>
`,
  },
};

export const AGREEMENT_TYPES = Object.keys(AGREEMENT_TEMPLATES) as AgreementType[];
