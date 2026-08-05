import { prisma } from "../../lib/prisma";
import { resend, MAIL_FROM } from "../../lib/resend";
import { emailQueue } from "../../jobs/emailQueue";
import { env } from "../../config/env";
import { logger } from "../../middleware/logger";
import { sendPush } from "./push.service";
import { Emails } from "../../lib/email/templates";

export type NotifyEvent =
  | "APPLICATION_RECEIVED"
  | "APPLICATION_SUBMITTED"
  | "STAGE_CHANGED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_RESCHEDULED"
  | "REJECTED"
  | "SELECTED"
  | "OFFER_GENERATED"
  | "OFFER_ACCEPTED"
  | "JOINED";

interface NotifyArgs {
  userId?: string;
  email?: string;
  event: NotifyEvent;
  title: string;
  message: string;
  link?: string;
  html?: string;
  /** Files to attach, e.g. the offer letter PDF. */
  attachments?: Array<{ filename: string; content: Buffer }>;
  /**
   * "inapp" skips email entirely. Use it for anything a team member would see
   * anyway next time they open the workspace — routine traffic does not deserve
   * an inbox interruption for every member of the hiring team.
   */
  channel?: "all" | "inapp";
}

/**
 * In-app always, email best-effort.
 *
 * Email goes through BullMQ when Redis is available so a slow SMTP call never
 * blocks a request; when Redis is disabled it falls back to a direct send.
 * A failed email must never fail the business transaction that triggered it.
 */
export async function notify(args: NotifyArgs) {
  const { userId, email, event, title, message, link, html, attachments, channel } = args;

  if (userId) {
    try {
      await prisma.notification.create({
        data: { userId, title, message, type: event, link },
      });
    } catch (err) {
      logger.error(`notification.inapp failed for ${userId}: ${(err as Error).message}`);
    }
  }

  // Push is best-effort on top of in-app; a failure here never affects the caller.
  if (userId) {
    sendPush(userId, { title, body: message, url: link, tag: event }).catch((err) =>
      logger.warn(`push dispatch failed: ${err.message}`)
    );
  }

  if (channel === "inapp") return;

  const to = email ?? (userId ? (await prisma.user.findUnique({ where: { id: userId } }))?.email : undefined);
  if (!to) return;

  const payload = {
    from: MAIL_FROM,
    to,
    subject: title,
    // Callers may pass a bespoke template; otherwise fall back to the branded
    // generic shell rather than raw unstyled HTML.
    html: html ?? Emails.generic({ title, message, link }),
    ...(attachments?.length
      ? { attachments: attachments.map((a) => ({ filename: a.filename, content: a.content })) }
      : {}),
  };

  try {
    if (emailQueue) {
      await emailQueue.add(event, payload, {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
      });
    } else {
      await resend.emails.send(payload);
    }
  } catch (err) {
    logger.error(`notification.email failed for ${to}: ${(err as Error).message}`);
  }
}

/** Fan-out to every active member of a tenant holding one of `roles`. */
export async function notifyTenantRoles(
  startupId: string,
  roles: string[],
  args: Omit<NotifyArgs, "userId" | "email">
) {
  const members = await prisma.startupMember.findMany({
    where: { startupId, status: "ACTIVE", role: { in: roles as never[] }, userId: { not: null } },
    select: { userId: true },
  });
  await Promise.allSettled(
    members.map((m) => notify({ ...args, userId: m.userId as string }))
  );
}
