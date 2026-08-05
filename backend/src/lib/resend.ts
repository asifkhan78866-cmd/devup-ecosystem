import { Resend } from "resend";
import { env } from "../config/env";
import { logger } from "../middleware/logger";
import { AppError } from "../middleware/errorHandler";
import { Emails } from "./email/templates";
import { renderEmail, p as para } from "./email/layout";

const client = new Resend(env.RESEND_API_KEY);

/**
 * The single sender identity for everything this backend sends.
 *
 * Always "Name <address>": a bare address shows up in the recipient's inbox as
 * the raw mailbox rather than the company, which is the difference between a
 * letter that looks issued and one that looks scripted.
 */
export const MAIL_FROM = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

/** Mail is on in production by default, off everywhere else unless asked for. */
const EMAIL_ON = env.EMAIL_ENABLED ?? env.NODE_ENV === "production";

/**
 * Every outbound mail in the codebase goes through here.
 *
 * `resend.emails.send` is deliberately not exported raw: a test run against the
 * real database once fanned real notifications out to real inboxes, and the only
 * reliable fix is a single place that decides whether a send may happen at all.
 *
 * Two independent controls, because "off" and "only me" are different needs:
 *   EMAIL_ENABLED   — whether mail is sent at all (defaults on in production).
 *   EMAIL_ALLOWLIST — when set, the ONLY addresses that may receive mail, in
 *                     any environment. Leave it empty in production.
 *
 * Set both to watch real letters land in your own inbox without a test run
 * reaching anybody else.
 */
if (env.NODE_ENV === "production" && env.EMAIL_ALLOWLIST.length > 0) {
  logger.warn(
    `EMAIL_ALLOWLIST is set in production (${env.EMAIL_ALLOWLIST.join(", ")}). ` +
      `Candidates and team members outside that list will receive NO email. ` +
      `Clear EMAIL_ALLOWLIST unless this is deliberate.`
  );
}
if (!EMAIL_ON) {
  logger.warn(`Email sending is OFF (NODE_ENV=${env.NODE_ENV}). Set EMAIL_ENABLED=true to send.`);
}

export const resend = {
  emails: {
    async send(payload: Parameters<Resend["emails"]["send"]>[0]) {
      const recipients = (Array.isArray(payload.to) ? payload.to : [payload.to]).filter(Boolean) as string[];

      if (!EMAIL_ON) {
        logger.info(`email off (${env.NODE_ENV}): "${payload.subject}" → ${recipients.join(", ")}`);
        return { data: null, error: null };
      }

      if (env.EMAIL_ALLOWLIST.length > 0) {
        const allowed = recipients.filter((r) => env.EMAIL_ALLOWLIST.includes(r.toLowerCase()));
        if (allowed.length === 0) {
          logger.info(`email skipped (not allowlisted): "${payload.subject}" → ${recipients.join(", ")}`);
          return { data: null, error: null };
        }
        return client.emails.send({ ...payload, to: allowed });
      }

      return client.emails.send(payload);
    },
  },
};

/**
 * Legacy template names kept so existing callers keep working, but every one
 * now renders through the shared branded shell (logo, table layout, footer)
 * instead of the bare <h1>/<p> markup they used before.
 */
export const EmailTemplates = {
  applicationReceived: (applicantName: string, startupName: string) =>
    renderEmail({
      heading: "Application received",
      body: para(`Hi ${applicantName},`) + para(`We have received your application for ${startupName}. Our team will review it shortly.`),
    }),

  applicationApproved: (founderName: string, startupName: string, link: string) =>
    renderEmail({
      heading: "Welcome to DevUp",
      body: para(`Hi ${founderName},`) + para(`Congratulations — ${startupName} has been approved.`),
      cta: { label: "Complete onboarding", url: link },
    }),

  applicationRejected: (founderName: string, startupName: string, reason: string) =>
    renderEmail({
      heading: "Update on your application",
      body:
        para(`Hi ${founderName},`) +
        para(`Thank you for applying with ${startupName}. Unfortunately we cannot proceed at this time.`) +
        para(`Reason: ${reason}`),
    }),

  documentReady: (founderName: string, documentName: string, link: string) =>
    renderEmail({
      heading: "Document ready for signature",
      body: para(`Hi ${founderName},`) + para(`Please sign the following document: ${documentName}.`),
      cta: { label: "Sign document", url: link },
    }),

  documentSigned: (startupName: string, documentName: string) =>
    renderEmail({
      heading: "Document signed",
      body: para(`${startupName} has signed the ${documentName}.`),
    }),

  jobApplicationReceived: (applicantName: string, roleName: string) =>
    renderEmail({
      heading: "New job application",
      body: para(`${applicantName} has applied for the ${roleName} role.`),
    }),

  welcomeEmail: (userName: string) => Emails.welcome(userName),

  cofounderRequest: (fromName: string, message: string) =>
    renderEmail({
      heading: "New co-founder connection request",
      body: para(`${fromName} wants to connect with you.`) + para(`Message: ${message}`),
      cta: { label: "View request", url: `${env.PUBLIC_SITE_URL}/dashboard/connections` },
    }),
};

export async function sendTeamInviteEmail(params: {
  to: string, startupName: string, role: string, inviteLink: string, logoUrl?: string | null
}) {
  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to: params.to,
    subject: `You've been invited to join ${params.startupName} on DevUp`,
    html: Emails.teamInvite(params.startupName, params.role, params.inviteLink, params.logoUrl),
  });

  if (error) {
    // Resend returns errors instead of throwing — surface them so the invite
    // endpoint reports a real failure instead of a false "sent".
    throw new AppError(502, `Email delivery failed: ${error.message}`, "EMAIL_SEND_FAILED");
  }
}

export async function sendDocumentReadyEmail(to: string, documentName: string) {
  await resend.emails.send({
    from: MAIL_FROM,
    to,
    subject: 'Document ready for signature - DevUp',
    html: EmailTemplates.documentReady("Founder", documentName, `${process.env.FRONTEND_URL}/dashboard/documents`),
  }).catch(e => console.error(e));
}

export async function sendDocumentSignedEmail(to: string, documentName: string, founderName: string) {
  await resend.emails.send({
    from: MAIL_FROM,
    to,
    subject: 'Document signed - DevUp',
    html: EmailTemplates.documentSigned(founderName, documentName),
  }).catch(e => console.error(e));
}
