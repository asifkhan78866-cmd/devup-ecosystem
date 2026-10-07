import { prisma } from "../../lib/prisma";
import { logger } from "../../middleware/logger";

/**
 * Attaches records that were created before someone had an account.
 *
 * People are routinely onboarded by email before they have signed up — that is
 * the whole point of direct hire. Those Employee, Intern, StartupMember and
 * PerkAward rows are written with `userId: null`, and every "my …" endpoint
 * filters on `userId`, so they have to be attached once the person arrives.
 *
 * An email address typed into a signup form proves nothing. Records are only
 * ever attached to an account whose ownership of that address has been proven
 * (`emailVerifiedAt`), and only when exactly one account answers to it. Before
 * this gate, anyone who signed up first with a new hire's address inherited
 * their onboarding, documents, payroll records and workspace seat.
 *
 * Race-safe and idempotent: every write is conditional on `userId IS NULL`, so
 * Postgres lets exactly one claimant win a row and repeat calls change nothing.
 */
export type ClaimResult = {
  claimed: boolean;
  reason?: "unverified" | "ambiguous" | "not_found";
  employees: number;
  interns: number;
  memberships: number;
  awards: number;
  activated: number;
};

const none = (reason?: ClaimResult["reason"]): ClaimResult => ({
  claimed: false,
  reason,
  employees: 0,
  interns: 0,
  memberships: 0,
  awards: 0,
  activated: 0,
});

/**
 * The single account that has proven it owns `email`, or null.
 *
 * Use this wherever a record is linked to "the account with this email" at
 * write time. Unverified accounts, and addresses that more than one account
 * answers to (legacy case variants), get nothing — the record waits unlinked
 * and is claimed once the real owner verifies.
 */
export async function findVerifiedUserIdByEmail(rawEmail: string): Promise<string | null> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return null;
  const users = await prisma.user.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, emailVerifiedAt: true },
    take: 2,
  });
  if (users.length !== 1 || !users[0].emailVerifiedAt) return null;
  return users[0].id;
}

export async function claimByEmail(userId: string): Promise<ClaimResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerifiedAt: true },
    });
    if (!user) return none("not_found");
    if (!user.emailVerifiedAt) return none("unverified");

    const email = user.email.trim().toLowerCase();
    if ((await findVerifiedUserIdByEmail(email)) !== userId) {
      logger.warn(`claim refused for user ${userId}: email is shared with another account`);
      return none("ambiguous");
    }

    const match = { equals: email, mode: "insensitive" as const };

    return await prisma.$transaction(async (tx) => {
      const [employees, interns, awards] = await Promise.all([
        tx.employee.updateMany({ where: { email: match, userId: null }, data: { userId } }),
        tx.intern.updateMany({ where: { email: match, userId: null }, data: { userId } }),
        tx.perkAward.updateMany({ where: { recipientEmail: match, userId: null }, data: { userId } }),
      ]);

      // One seat per startup: never attach a second membership row to someone
      // already in that startup under another row.
      const seated = await tx.startupMember.findMany({
        where: { userId },
        select: { startupId: true },
      });
      const memberships = await tx.startupMember.updateMany({
        where: {
          email: match,
          userId: null,
          startupId: { notIn: seated.map((m) => m.startupId) },
        },
        data: { userId },
      });

      /**
       * A direct hire's membership is parked at INVITED purely because there
       * was no account to attach it to — HR already decided they are on the
       * team, so there is no invitation for them to accept.
       *
       * Only memberships backed by an actual Employee or Intern record are
       * activated. A genuine pending invite (say, a co-founder invited as ADMIN
       * with no HR record behind it) still has to be accepted properly.
       */
      let activated = 0;
      if (employees.count > 0 || interns.count > 0) {
        const backing = await Promise.all([
          tx.employee.findMany({ where: { userId }, select: { startupId: true } }),
          tx.intern.findMany({ where: { userId }, select: { startupId: true } }),
        ]);
        const startupIds = [...new Set(backing.flat().map((r) => r.startupId))];

        if (startupIds.length > 0) {
          const res = await tx.startupMember.updateMany({
            where: { userId, startupId: { in: startupIds }, status: "INVITED" },
            data: { status: "ACTIVE", joinedAt: new Date() },
          });
          activated = res.count;
        }
      }

      const total = employees.count + interns.count + memberships.count + awards.count;
      if (total > 0) {
        logger.info(
          `claimed for user ${userId}: ${employees.count} employee, ${interns.count} intern, ` +
            `${memberships.count} membership (${activated} activated), ${awards.count} award`
        );
      }

      return {
        claimed: total > 0,
        employees: employees.count,
        interns: interns.count,
        memberships: memberships.count,
        awards: awards.count,
        activated,
      };
    });
  } catch (err) {
    // Never block a sign-up or a dashboard read because reconciliation failed.
    logger.error(`claimByEmail failed for user ${userId}: ${(err as Error).message}`);
    return none();
  }
}

/**
 * Self-heal for accounts that verified before something was created for them.
 *
 * The "my …" endpoints call this only when they were about to return nothing,
 * so it costs one indexed lookup in the case that is already broken and nothing
 * at all in the normal case.
 */
export async function claimIfEmpty(userId: string, foundAnything: boolean) {
  if (foundAnything) return false;
  return (await claimByEmail(userId)).claimed;
}
