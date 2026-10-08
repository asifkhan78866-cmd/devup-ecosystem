import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { logger } from "../../middleware/logger";
import { newToken, hashToken } from "../../lib/tokens";
import { resend, MAIL_FROM } from "../../lib/resend";
import { Emails } from "../../lib/email/templates";
import { WORKSPACE_URL } from "../../lib/email/layout";

/**
 * Access to a hackathon registration.
 *
 * A registration used to be addressed by its database id, and anyone could
 * learn that id by typing the team's phone number into the status form — along
 * with every member's name, email and phone. With the id they could rewrite the
 * team or submit on its behalf.
 *
 * Now a registration is managed with a private token: 256 random bits, only the
 * SHA-256 stored. The registrant's browser receives it at signup and their
 * inbox receives it in a "manage your registration" link. Every lead endpoint
 * resolves "the registration this token belongs to, in this hackathon" — no
 * lead id is accepted from, or returned to, the client.
 */

const LINK_COOLDOWN_MS = 2 * 60_000;

const noAccess = () =>
  new AppError(401, "This link is invalid or has expired. Request a new one.", "LEAD_ACCESS_DENIED");

export function accessLink(hackathonId: string, token: string) {
  // The token rides in the fragment, which browsers never send to a server.
  return `${WORKSPACE_URL}/hackathons/${hackathonId}#lead=${token}`;
}

/** Gives a registration a fresh token; any previous one stops working. */
export async function issueLeadToken(leadId: string) {
  const { token, hash } = newToken();
  await prisma.hackathonLead.update({ where: { id: leadId }, data: { accessTokenHash: hash } });
  return token;
}

/** The registration a token belongs to, in this hackathon — or a 401. */
export async function leadFromToken(hackathonId: string, rawToken: unknown) {
  if (typeof rawToken !== "string" || rawToken.length < 20 || rawToken.length > 200) throw noAccess();
  const lead = await prisma.hackathonLead.findUnique({
    where: { accessTokenHash: hashToken(rawToken) },
    include: { submission: true, hackathon: { select: { title: true } } },
  });
  if (!lead || lead.hackathonId !== hackathonId) throw noAccess();
  return lead;
}

async function sendAccessEmail(to: string, hackathonTitle: string, link: string) {
  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to,
    subject: `Manage your ${hackathonTitle} registration`,
    html: Emails.hackathonAccess(hackathonTitle, link),
  });
  if (error) logger.error(`hackathon access email not delivered: ${error.message}`);
}

/** Emails a newly registered team its management link. Best effort. */
export async function sendRegistrationLink(lead: { email: string | null; hackathonId: string }, hackathonTitle: string, token: string) {
  if (!lead.email) return;
  await sendAccessEmail(lead.email, hackathonTitle, accessLink(lead.hackathonId, token));
}

/**
 * "I lost my link." Always answers the same way. If a registration with this
 * phone exists and has an email, a fresh link goes to that inbox — never to the
 * person asking — at most once every two minutes. Issuing it retires the old
 * token.
 */
export async function requestAccessLink(hackathonId: string, phone: string) {
  const lead = await prisma.hackathonLead.findUnique({
    where: { hackathonId_phone: { hackathonId, phone } },
    include: { hackathon: { select: { title: true } } },
  });
  if (!lead?.email) return;

  // Claim the send atomically so concurrent requests cannot each send one.
  const now = new Date();
  const { count } = await prisma.hackathonLead.updateMany({
    where: {
      id: lead.id,
      OR: [{ accessLinkSentAt: null }, { accessLinkSentAt: { lt: new Date(now.getTime() - LINK_COOLDOWN_MS) } }],
    },
    data: { accessLinkSentAt: now },
  });
  if (count !== 1) return;

  const token = await issueLeadToken(lead.id);
  await sendAccessEmail(lead.email, lead.hackathon.title, accessLink(hackathonId, token));
}

/** What a team sees of its own registration. No internal ids. */
export function ownView(lead: Awaited<ReturnType<typeof leadFromToken>>) {
  return {
    name: lead.name,
    teamCount: lead.teamCount,
    teamName: lead.teamName,
    college: lead.college,
    preferences: lead.preferences,
    members: lead.members,
    submission: lead.submission
      ? { status: lead.submission.status, createdAt: lead.submission.createdAt }
      : null,
  };
}
