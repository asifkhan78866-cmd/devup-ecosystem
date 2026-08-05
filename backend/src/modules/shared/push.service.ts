import webpush from "web-push";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { logger } from "../../middleware/logger";

/**
 * Web Push (VAPID) rather than Firebase Cloud Messaging.
 *
 * The app already ships a Serwist service worker for the PWA, and VAPID is the
 * browser standard that worker speaks natively — no second SW file, no external
 * project, no SDK. FCM would add a firebase-messaging-sw.js that conflicts with
 * the existing one. If native iOS/Android apps are added later, FCM can be
 * layered in behind this same `sendPush` interface.
 */

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    env.VAPID_SUBJECT || `mailto:${env.RESEND_FROM_EMAIL}`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
  configured = true;
  return true;
}

export function isPushEnabled() {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

export async function subscribe(args: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: args.endpoint },
    create: args,
    update: { userId: args.userId, p256dh: args.p256dh, auth: args.auth, lastUsedAt: new Date() },
  });
}

export async function unsubscribe(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Best-effort delivery to every device a user has registered.
 * Subscriptions rejected as gone (404/410) are pruned automatically —
 * otherwise dead endpoints accumulate forever and slow every send.
 */
export async function sendPush(userId: string, payload: PushPayload) {
  if (!ensureConfigured()) return { sent: 0, skipped: true };

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return { sent: 0, skipped: false };

  const body = JSON.stringify(payload);
  let sent = 0;
  const dead: string[] = [];

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        );
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          dead.push(s.endpoint);
        } else {
          logger.warn(`push failed for ${s.endpoint.slice(0, 40)}…: ${err?.message}`);
        }
      }
    })
  );

  if (dead.length) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: dead } } });
  }

  return { sent, pruned: dead.length, skipped: false };
}
