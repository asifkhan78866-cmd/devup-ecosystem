import { prisma } from "../../lib/prisma";
import { logger } from "../../middleware/logger";

/**
 * Attaches records that were created before someone had an account.
 *
 * People are routinely onboarded by email before they have signed up — that is
 * the whole point of direct hire. Those Employee, Intern and StartupMember rows
 * are written with `userId: null`, and every "my …" endpoint filters on
 * `userId`. So the moment the person finally signs up they see an empty
 * dashboard: no workspace, no onboarding checklist, no attendance, despite HR
 * having onboarded them days earlier.
 *
 * This closes that gap by claiming anything matching their email. Safe to call
 * repeatedly — it only ever touches rows where `userId` is still null.
 */
export async function claimByEmail(userId: string, rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return { employees: 0, interns: 0, memberships: 0 };

  try {
    const [employees, interns] = await Promise.all([
      prisma.employee.updateMany({
        where: { email: { equals: email, mode: "insensitive" }, userId: null },
        data: { userId },
      }),
      prisma.intern.updateMany({
        where: { email: { equals: email, mode: "insensitive" }, userId: null },
        data: { userId },
      }),
    ]);

    const memberships = await prisma.startupMember.updateMany({
      where: { email: { equals: email, mode: "insensitive" }, userId: null },
      data: { userId },
    });

    /**
     * A direct hire's membership is parked at INVITED purely because there was
     * no account to attach it to — HR already decided they are on the team, so
     * there is no invitation for them to accept.
     *
     * Only memberships backed by an actual Employee or Intern record are
     * activated. A genuine pending invite (say, a co-founder invited as ADMIN
     * with no HR record behind it) still has to be accepted properly.
     */
    let activated = 0;
    if (employees.count > 0 || interns.count > 0) {
      const backing = await Promise.all([
        prisma.employee.findMany({ where: { userId }, select: { startupId: true } }),
        prisma.intern.findMany({ where: { userId }, select: { startupId: true } }),
      ]);
      const startupIds = [...new Set(backing.flat().map((r) => r.startupId))];

      if (startupIds.length > 0) {
        const res = await prisma.startupMember.updateMany({
          where: { userId, startupId: { in: startupIds }, status: "INVITED" },
          data: { status: "ACTIVE", joinedAt: new Date() },
        });
        activated = res.count;
      }
    }

    const total = employees.count + interns.count + memberships.count;
    if (total > 0) {
      logger.info(
        `claimed ${email}: ${employees.count} employee, ${interns.count} intern, ` +
          `${memberships.count} membership (${activated} activated)`
      );
    }

    return {
      employees: employees.count,
      interns: interns.count,
      memberships: memberships.count,
      activated,
    };
  } catch (err) {
    // Never block a sign-up or a dashboard read because reconciliation failed.
    logger.error(`claimByEmail failed for ${email}: ${(err as Error).message}`);
    return { employees: 0, interns: 0, memberships: 0, activated: 0 };
  }
}

/**
 * Self-heal for accounts that signed up before the claim existed.
 *
 * The "my …" endpoints call this only when they were about to return nothing,
 * so it costs one indexed lookup in the case that is already broken and nothing
 * at all in the normal case.
 */
export async function claimIfEmpty(userId: string, email: string | undefined, foundAnything: boolean) {
  if (foundAnything || !email) return false;
  const result = await claimByEmail(userId, email);
  return result.employees + result.interns + result.memberships > 0;
}
