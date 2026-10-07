import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { logger } from "../../middleware/logger";
import { newToken, hashToken } from "../../lib/tokens";
import { resend, MAIL_FROM } from "../../lib/resend";
import { Emails } from "../../lib/email/templates";
import { WORKSPACE_URL } from "../../lib/email/layout";
import { supabaseAdmin, createSessionClient } from "../../config/supabase";
import { claimByEmail } from "../shared/claim.service";
import { productionGaps } from "../../config/env";

/**
 * Proof that a person controls an email address.
 *
 * Signing up proves nothing about the address typed into the form, so nothing
 * keyed by email is attached to an account until its owner follows a link that
 * was sent only to that inbox. The link:
 *
 *   - carries 256 random bits, of which only the SHA-256 is stored;
 *   - expires, works once, and kills every older link for the account;
 *   - travels in the URL fragment, so it never reaches a server log or a
 *     Referer header.
 *
 * Following it also *sets the password*. Whoever typed the address at signup
 * may not be its owner — someone could register a new hire's email before they
 * do. The inbox owner choosing the password at verification, and every
 * existing session being revoked, means a squatter's password and sessions die
 * the moment the real owner verifies.
 */

export const VERIFICATION_TTL_HOURS = 24;
const MAX_LINKS_PER_HOUR = 5;

/** One message for every failure, so the response says nothing about who exists. */
const invalidLink = () =>
  new AppError(400, "This link is invalid or has expired. Request a new one.", "INVALID_VERIFICATION_LINK");

const unavailable = () =>
  new AppError(503, "We could not finish verifying your email. Please try again.", "VERIFICATION_UNAVAILABLE");

/**
 * Signup is only possible if the link can actually be delivered. Production
 * without a mail provider would otherwise tell every new user to check an inbox
 * that will never receive anything — an outage that looks like success.
 */
export function assertVerificationMailConfigured() {
  if (productionGaps.emailDisabled) {
    throw new AppError(
      503,
      "Signup is temporarily unavailable. Please try again later.",
      "EMAIL_DELIVERY_UNCONFIGURED"
    );
  }
}

export function verificationLink(token: string) {
  return `${WORKSPACE_URL}/auth/verify-email#token=${token}`;
}

async function send(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send({ from: MAIL_FROM, to, subject, html });
  // The caller always answers the same way whether or not mail went out, so a
  // delivery failure is logged rather than surfaced.
  if (error) logger.error(`account email "${subject}" not delivered: ${error.message}`);
}

/** Issues a fresh link for an unverified account and emails it. Older links stop working. */
export async function issueVerification(userId: string, email: string) {
  const recent = await prisma.emailVerification.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - 60 * 60_000) } },
  });
  if (recent >= MAX_LINKS_PER_HOUR) {
    logger.warn(`verification link cap reached for user ${userId}`);
    return;
  }

  const { token, hash } = newToken();
  const now = new Date();
  await prisma.$transaction([
    // Only the newest link works: an older one sitting in an inbox is retired.
    prisma.emailVerification.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } }),
    prisma.emailVerification.create({
      data: {
        userId,
        email,
        tokenHash: hash,
        expiresAt: new Date(now.getTime() + VERIFICATION_TTL_HOURS * 60 * 60_000),
      },
    }),
  ]);

  await send(email, "Confirm your email for DevUp", Emails.verifyEmail(verificationLink(token), VERIFICATION_TTL_HOURS));
}

/** Tells the owner of an already-verified address that someone tried to sign up with it. */
export async function sendAccountExistsNotice(email: string) {
  await send(email, "You already have a DevUp account", Emails.accountExists(`${WORKSPACE_URL}/login`));
}

/**
 * Public "send me a new link". Always succeeds from the caller's point of view;
 * only an unverified account that exactly one user holds gets an email.
 */
export async function resendVerification(rawEmail: string) {
  assertVerificationMailConfigured();
  const email = String(rawEmail ?? "").trim().toLowerCase();
  if (!email) return;
  const users = await prisma.user.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, emailVerifiedAt: true },
    take: 2,
  });
  if (users.length === 1 && !users[0].emailVerifiedAt) {
    await issueVerification(users[0].id, users[0].email);
  }
}

/**
 * Signs the account out everywhere. Supabase only revokes sessions given one of
 * the account's own tokens, so mint one with the password just set and use it
 * to revoke them all — including any the person who registered was holding.
 */
async function revokeAllSessions(email: string, password: string) {
  const { data, error } = await createSessionClient().auth.signInWithPassword({ email, password });
  if (error || !data.session) throw unavailable();
  const { error: outError } = await supabaseAdmin.auth.admin.signOut(data.session.access_token, "global");
  if (outError) throw unavailable();
}

export async function verifyEmail(rawToken: string, password: string) {
  if (typeof rawToken !== "string" || rawToken.length < 20 || rawToken.length > 200) throw invalidLink();

  const row = await prisma.emailVerification.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!row || row.usedAt || row.expiresAt <= new Date()) throw invalidLink();
  // The account's address changed since the link was sent: it proves nothing now.
  if (row.email.toLowerCase() !== row.user.email.toLowerCase()) throw invalidLink();

  const { error } = await supabaseAdmin.auth.admin.updateUserById(row.userId, {
    password,
    email_confirm: true,
  });
  if (error) {
    if (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500) throw unavailable();
    if (error.code === "weak_password" || /password/i.test(error.message)) {
      throw new AppError(400, error.message, "WEAK_PASSWORD");
    }
    logger.error(`verification: could not update auth user ${row.userId} (status ${error.status ?? "n/a"})`);
    throw unavailable();
  }

  await revokeAllSessions(row.user.email, password);

  // Single use, enforced by the database: of two simultaneous submissions of the
  // same link, exactly one consumes it.
  const now = new Date();
  const consumed = await prisma.emailVerification.updateMany({
    where: { id: row.id, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (consumed.count !== 1) throw invalidLink();

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { id: row.userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: now },
    }),
    prisma.emailVerification.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: now },
    }),
  ]);

  const claim = await claimByEmail(row.userId);
  return { verified: true, recordsLinked: claim.claimed };
}
