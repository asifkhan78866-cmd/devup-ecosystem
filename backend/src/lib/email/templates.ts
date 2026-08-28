import { renderEmail, p, strong, details, SITE_URL } from "./layout";

/**
 * Every outbound email in one place, all rendered through the shared branded
 * shell so the logo, spacing and footer stay consistent.
 */

const appUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** A heading inside the body, for mail that has more than one section. */
const sectionTitle = (text: string) =>
  `<p style="margin:26px 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;
     letter-spacing:1.6px;text-transform:uppercase;color:#c8f135;">${text}</p>`;

/**
 * One attachment, numbered. A table rather than a list: Outlook renders
 * <ol> margins unpredictably, and this mail is mostly read on a phone.
 */
const docItem = (n: string, title: string, detail: string) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="margin:0 0 12px;border-collapse:collapse;">
    <tr>
      <td width="30" valign="top"
          style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#c8f135;padding-top:1px;">
        ${n}
      </td>
      <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#ffffff;line-height:1.6;">
        <strong style="color:#ffffff;">${title}</strong><br>
        <span style="color:#8b8b8b;font-size:13px;">${detail}</span>
      </td>
    </tr>
  </table>`;

export const Emails = {
  welcome: (name: string) =>
    renderEmail({
      heading: "Welcome to DevUp Ecosystem",
      preheader: "Your account is ready — build, hire and get hired.",
      body:
        p(`Hi ${name},`) +
        p("Your account is live. You can now browse open roles across every startup in the ecosystem, enter hackathons, and connect with founders.") +
        p("Start by completing your profile — it autofills every application you send, so you only fill it once."),
      cta: { label: "Complete your profile", url: appUrl("/profile") },
    }),

  teamInvite: (startupName: string, role: string, inviteLink: string, logoUrl?: string | null) =>
    renderEmail({
      heading: "You have been invited",
      preheader: `Join ${startupName} on DevUp Ecosystem`,
      body:
        p(`You have been invited to join ${startupName} as a ${role.replace(/_/g, " ").toLowerCase()}.`) +
        p("Accept the invite to access their workspace."),
      cta: { label: "Accept invite", url: inviteLink },
      footnote: `If the button does not work, copy this link into your browser:<br>${inviteLink}`,
      fromOrg: startupName,
      orgLogoUrl: logoUrl,
    }),

  // ── Recruiting ────────────────────────────────────
  applicationSubmitted: (args: {
    name: string; jobTitle: string; startupName: string; applicationNo: string; applicationId: string;
  logoUrl?: string | null;
  }) =>
    renderEmail({
      heading: "Application received",
      preheader: `${args.startupName} has your application for ${args.jobTitle}`,
      body:
        p(`Hi ${args.name},`) +
        p(`Your application to ${args.startupName} has been received. You can track its progress at any time.`) +
        details([
          ["Role", args.jobTitle],
          ["Company", args.startupName],
          ["Reference", args.applicationNo],
        ]),
      cta: { label: "Track application", url: appUrl(`/dashboard/applications`) },
      fromOrg: args.startupName,
      orgLogoUrl: args.logoUrl,
    }),

  newApplicant: (args: {
    applicantName: string; jobTitle: string; applicationNo: string; college?: string; workspaceUrl: string; startupName: string;
  logoUrl?: string | null;
  }) =>
    renderEmail({
      heading: `New applicant for ${args.jobTitle}`,
      preheader: `${args.applicantName} applied — ${args.applicationNo}`,
      body:
        p(`${args.applicantName} has applied for ${args.jobTitle}.`) +
        details([
          ["Candidate", args.applicantName],
          ["College", args.college],
          ["Reference", args.applicationNo],
        ]),
      cta: { label: "Review candidate", url: args.workspaceUrl },
      fromOrg: args.startupName,
      orgLogoUrl: args.logoUrl,
    }),

  stageChanged: (args: { name: string; jobTitle: string; startupName: string; stage: string; applicationId: string; logoUrl?: string | null;
  }) =>
    renderEmail({
      heading: "Your application moved forward",
      preheader: `${args.jobTitle} — now at ${args.stage}`,
      body:
        p(`Hi ${args.name},`) +
        p(`Your application to ${args.startupName} for ${args.jobTitle} has progressed.`) +
        details([
          ["Role", args.jobTitle],
          ["Current stage", args.stage],
        ]),
      cta: { label: "View application", url: appUrl(`/dashboard/applications`) },
      fromOrg: args.startupName,
      orgLogoUrl: args.logoUrl,
    }),

  interviewScheduled: (args: {
    name: string; jobTitle: string; startupName: string; round: string;
    when: string; mode: string; meetingUrl?: string | null;
  logoUrl?: string | null;
  }) =>
    renderEmail({
      heading: "Interview scheduled",
      preheader: `${args.round} for ${args.jobTitle} — ${args.when}`,
      body:
        p(`Hi ${args.name},`) +
        p(`Your ${args.round.toLowerCase()} with ${args.startupName} has been scheduled.`) +
        details([
          ["Role", args.jobTitle],
          ["Round", args.round],
          ["When", args.when],
          ["Mode", args.mode],
        ]),
      cta: args.meetingUrl ? { label: "Join interview", url: args.meetingUrl } : undefined,
      footnote: "Please join a few minutes early. If you need to reschedule, reply to this email.",
      fromOrg: args.startupName,
      orgLogoUrl: args.logoUrl,
    }),

  selected: (args: { name: string; jobTitle: string; startupName: string; logoUrl?: string | null;
  }) =>
    renderEmail({
      heading: "You have been selected",
      preheader: `${args.startupName} has selected you for ${args.jobTitle}`,
      body:
        p(`Hi ${args.name},`) +
        p(`Congratulations. ${args.startupName} has selected you for the ${args.jobTitle} role.`) +
        p("Your offer letter will follow shortly."),
      cta: { label: "View application", url: appUrl("/dashboard/applications") },
      fromOrg: args.startupName,
      orgLogoUrl: args.logoUrl,
    }),

  offerGenerated: (args: {
    name: string; designation: string; startupName: string; offerNo: string;
    joiningDate: string; expiresAt: string; ctc?: string | null; stipend?: string | null;
    logoUrl?: string | null;
    /** Shown in the mail so the candidate can prepare before day one. */
    documentsChecklist?: string[];
    reportingTo?: string | null;
    workLocation?: string | null;
  }) =>
    renderEmail({
      heading: "Your offer letter is ready",
      preheader: `${args.startupName} — ${args.designation}. Respond by ${args.expiresAt}.`,
      body:
        p(`Hi ${args.name},`) +
        p(`Congratulations. ${args.startupName} has issued your offer for the ${args.designation} role.`) +
        details([
          ["Position", args.designation],
          ["Offer number", args.offerNo],
          ["Annual CTC", args.ctc],
          ["Monthly stipend", args.stipend],
          ["Joining date", args.joiningDate],
          ["Reporting to", args.reportingTo],
          ["Work location", args.workLocation],
          ["Respond by", args.expiresAt],
        ]),
      cta: { label: "Accept or decline", url: appUrl("/dashboard/applications") },
      footnote:
        "Your signed offer letter is attached as a PDF — keep a copy for your records. " +
        "This offer expires two days before your joining date, and every document below must be " +
        "uploaded and verified before you can join." +
        (args.documentsChecklist?.length
          ? "<br><br><strong style=\"color:#e4e4e4;\">Documents to keep ready for joining:</strong><br>" +
            args.documentsChecklist.map((d) => "&bull; " + d).join("<br>")
          : ""),
      fromOrg: args.startupName,
      orgLogoUrl: args.logoUrl,
    }),

  offerAccepted: (args: { candidateName: string; designation: string; startupName: string; joiningDate: string; workspaceUrl: string; logoUrl?: string | null;
  }) =>
    renderEmail({
      heading: "Offer accepted",
      preheader: `${args.candidateName} accepted the ${args.designation} offer`,
      body:
        p(`${args.candidateName} has accepted the offer for ${args.designation}.`) +
        details([["Joining date", args.joiningDate]]) +
        p("You can now onboard them from the workspace."),
      cta: { label: "Onboard candidate", url: args.workspaceUrl },
      fromOrg: args.startupName,
      orgLogoUrl: args.logoUrl,
    }),

  rejected: (args: { name: string; jobTitle: string; startupName: string; logoUrl?: string | null;
  }) =>
    renderEmail({
      heading: "Update on your application",
      preheader: `Regarding your application to ${args.startupName}`,
      body:
        p(`Hi ${args.name},`) +
        p(`Thank you for your interest in the ${args.jobTitle} role at ${args.startupName}, and for the time you put into the process.`) +
        p("On this occasion we will not be moving forward with your application. This decision reflects the fit for this particular role rather than your ability, and we would welcome an application from you for future openings.") +
        p("We wish you the very best."),
      cta: { label: "Browse other roles", url: appUrl("/careers") },
      fromOrg: args.startupName,
      orgLogoUrl: args.logoUrl,
    }),

  joined: (args: { name: string; startupName: string; employeeCode: string; designation: string; logoUrl?: string | null;
  }) =>
    renderEmail({
      heading: `Welcome to ${args.startupName}`,
      preheader: `Your employee ID is ${args.employeeCode}`,
      body:
        p(`Hi ${args.name},`) +
        p(`Welcome aboard. You are now part of ${args.startupName}.`) +
        details([
          ["Employee ID", args.employeeCode],
          ["Designation", args.designation],
        ]) +
        p("Keep your employee ID handy — it appears on every document issued to you."),
      cta: { label: "Go to dashboard", url: appUrl("/dashboard") },
      fromOrg: args.startupName,
      orgLogoUrl: args.logoUrl,
    }),

  documentIssued: (args: { name: string; docType: string; documentNo: string; startupName: string; logoUrl?: string | null;
  }) =>
    renderEmail({
      heading: `Your ${args.docType.toLowerCase()} is ready`,
      preheader: `${args.documentNo} issued by ${args.startupName}`,
      body:
        p(`Hi ${args.name},`) +
        p(`${args.startupName} has issued your ${args.docType.toLowerCase()}.`) +
        details([
          ["Document", args.docType],
          ["Reference", args.documentNo],
        ]),
      cta: { label: "View document", url: appUrl("/dashboard") },
      fromOrg: args.startupName,
      orgLogoUrl: args.logoUrl,
    }),

  documentsRequested: (args: {
    name: string; startupName: string; uploadUrl: string;
    documents: string[]; logoUrl?: string | null;
  }) =>
    renderEmail({
      heading: "Documents needed to complete your onboarding",
      preheader: `${args.startupName} needs a few documents from you`,
      body:
        p(`Hi ${args.name},`) +
        p(`${args.startupName} needs the following documents to complete your onboarding. You can upload them from your dashboard — photos of the originals are fine.`) +
        `<ul style="margin:0 0 14px;padding-left:20px;color:#e4e4e4;">` +
        args.documents.map((d) => `<li style="margin-bottom:6px;">${d}</li>`).join("") +
        `</ul>` +
        p("Your documents are visible only to your organisation's HR team."),
      cta: { label: "Upload documents", url: args.uploadUrl },
      fromOrg: args.startupName,
      orgLogoUrl: args.logoUrl,
    }),

  documentRejected: (args: {
    name: string; startupName: string; document: string; reason: string;
    uploadUrl: string; logoUrl?: string | null;
  }) =>
    renderEmail({
      heading: "A document needs re-uploading",
      preheader: `${args.document} could not be accepted`,
      body:
        p(`Hi ${args.name},`) +
        p(`Your ${args.document} could not be accepted.`) +
        details([["Document", args.document], ["Reason", args.reason]]) +
        p("Please upload a clearer or corrected copy."),
      cta: { label: "Re-upload document", url: args.uploadUrl },
      fromOrg: args.startupName,
      orgLogoUrl: args.logoUrl,
    }),

  onboardingComplete: (args: {
    name: string; startupName: string; employeeCode: string; logoUrl?: string | null;
  }) =>
    renderEmail({
      heading: "Your onboarding is complete",
      preheader: `All documents verified — welcome to ${args.startupName}`,
      body:
        p(`Hi ${args.name},`) +
        p(`All your documents have been verified. Your onboarding with ${args.startupName} is complete.`) +
        details([["Employee ID", args.employeeCode]]),
      cta: { label: "Go to dashboard", url: appUrl("/dashboard") },
      fromOrg: args.startupName,
      orgLogoUrl: args.logoUrl,
    }),

  /**
   * The welcome a new director actually receives.
   *
   * Bespoke rather than routed through `generic`, which folds everything into a
   * single paragraph — this mail has to introduce three separate attachments
   * and say what each is for, and that is a list, not a sentence.
   *
   * Ordered by what matters to the reader rather than to us: the handbook
   * first, because it says what to do on Monday, and the deed last, because it
   * is the one they will skim.
   */
  leadAppointment: (args: {
    fullName: string;
    office: string;
    territory: string;
    documentNo: string;
    from: string;
    to: string;
    verifyUrl?: string;
  }) =>
    renderEmail({
      heading: `Welcome to the directorate, ${args.fullName.split(" ")[0]}`,
      preheader: `You are appointed ${args.office} for ${args.territory}.`,
      body:
        p(
          `It is our pleasure to appoint you ${args.office} for ${args.territory} under the ` +
            `Lead DevUp programme. You were chosen because we think you will do something with the ` +
            `territory, not simply hold it.`
        ) +
        details([
          ["Office", args.office],
          ["Territory", args.territory],
          ["Term", `${args.from} — ${args.to}`],
          ["Instrument", args.documentNo],
        ]) +
        sectionTitle("Three documents are attached") +
        docItem(
          "1",
          "Directorate Handbook",
          "Read this one first. Your first thirty days, the weekly rhythm, what to report and to " +
            "whom, and what a good quarter looks like."
        ) +
        docItem(
          "2",
          "Certificate of Appointment",
          "Sealed and signed. This one is yours to keep and to share."
        ) +
        docItem(
          "3",
          "Deed of Appointment",
          "The terms of the office. Read it in full, sign where indicated, and keep a copy — " +
            "you will be asked for it."
        ) +
        p(
          `Your deed carries a revenue stamp with a QR code. Anyone who needs to confirm you hold ` +
            `this office can scan it and see the answer, so keep the stamp intact on any copy you print.`
        ),
      cta: args.verifyUrl ? { label: "See your public verification", url: args.verifyUrl } : undefined,
      footnote:
        "Keep this email. The attachments are the only copies sent, and the instrument number above " +
        "identifies your appointment in any correspondence.",
    }),

  // ── Generic fallback for notifications without a bespoke template ──
  generic: (args: { title: string; message: string; link?: string; fromOrg?: string; logoUrl?: string | null }) =>
    renderEmail({
      heading: args.title,
      preheader: args.message,
      body: p(args.message),
      cta: args.link ? { label: "View details", url: appUrl(args.link) } : undefined,
      fromOrg: args.fromOrg,
      orgLogoUrl: args.logoUrl,
    }),
};
