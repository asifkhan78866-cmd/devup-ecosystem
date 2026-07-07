import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";

/**
 * Attach a user to a startup as an ACTIVE OWNER — the single source of truth for
 * establishing startup ownership. Reused by every path that needs it: self-serve
 * startup creation, application approval, and (Phase 3) admin founder-invite
 * acceptance, so the StartupMember write lives in exactly one place.
 *
 * Upsert-based, keyed on the [startupId, email] unique: creates an ACTIVE OWNER
 * row when none exists, or promotes an existing row (e.g. an INVITED invite) to
 * ACTIVE OWNER. Idempotent — calling it twice never produces a duplicate member.
 *
 * Takes a transaction client (`Prisma.TransactionClient`) so callers keep their
 * atomicity; the full `prisma` client is assignable here for non-transactional
 * callers.
 */
export async function createStartupOwnership(
  db: Prisma.TransactionClient,
  args: { startupId: string; userId: string; email?: string; invitedBy?: string }
) {
  const email =
    args.email ?? (await db.user.findUnique({ where: { id: args.userId } }))?.email;

  if (!email) {
    throw new Error(`createStartupOwnership: no email found for user ${args.userId}`);
  }

  return db.startupMember.upsert({
    where: { startupId_email: { startupId: args.startupId, email } },
    update: {
      userId: args.userId,
      role: "OWNER",
      status: "ACTIVE",
      joinedAt: new Date(),
    },
    create: {
      startupId: args.startupId,
      userId: args.userId,
      email,
      role: "OWNER",
      status: "ACTIVE",
      invitedBy: args.invitedBy ?? args.userId,
      inviteToken: randomBytes(24).toString("hex"),
      joinedAt: new Date(),
    },
  });
}
