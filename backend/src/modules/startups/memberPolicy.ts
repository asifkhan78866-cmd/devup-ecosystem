import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { OWNER_ROLES, MANAGE_ROLES } from "../../lib/tenantRoles";

/**
 * Who may do what to a startup's members.
 *
 * Every member operation answers three questions, in this order, and never
 * skips one:
 *
 *   1. What is the caller's standing in *this* startup?   → standingIn()
 *   2. Is the target member *in this startup*?            → the query itself:
 *        WHERE id = memberId AND startupId = startupId
 *   3. Does the caller's standing permit this operation on this target?
 *                                                          → the rules below
 *
 * Authorising against one startup and then writing to a member found by id
 * alone is how a founder of startup A could rewrite or delete startup B's team.
 * A member id from another startup is simply "not found" here.
 */

export type Actor = { id: string; role: string };

/** Platform staff act with full authority — the same rule the tenant workspace applies. */
export const PLATFORM = "PLATFORM_ADMIN" as const;
export type Standing = string;

const isOwnerRole = (role: string) => (OWNER_ROLES as readonly string[]).includes(role);

/** Same answer for "no such startup" and "not yours", so ids cannot be probed. */
export const startupNotFound = () => new AppError(404, "Startup not found", "NOT_FOUND");
export const memberNotFound = () => new AppError(404, "Member not found", "NOT_FOUND");
const forbidden = (message: string) => new AppError(403, message, "FORBIDDEN");

/** The caller's role in this startup, or a 404 if they have no active seat in it. */
export async function standingIn(startupId: string, actor: Actor): Promise<Standing> {
  if (actor.role === "ADMIN" || actor.role === "SUPER_ADMIN") {
    const exists = await prisma.startup.findUnique({ where: { id: startupId }, select: { id: true } });
    if (!exists) throw startupNotFound();
    return PLATFORM;
  }

  const seat = await prisma.startupMember.findFirst({
    where: { startupId, userId: actor.id, status: "ACTIVE" },
    select: { role: true },
  });
  if (!seat) throw startupNotFound();
  return seat.role;
}

/** Founders (and platform staff) manage the team; nobody else does. */
export const canManageMembers = (standing: Standing) => standing === PLATFORM || isOwnerRole(standing);

/** Addresses of other members are for the people who run the startup. */
export const canSeeMemberEmails = (standing: Standing) =>
  standing === PLATFORM || (MANAGE_ROLES as readonly string[]).includes(standing);

type Target = { userId: string | null; role: string };

/**
 * Throws unless `actor` may give `target` the role `newRole`.
 *
 * Founder authority is never created by a role change — it comes from a
 * founder invitation or from DevUp. A founder cannot demote a co-founder, and
 * nobody changes their own role.
 */
export function assertCanChangeRole(standing: Standing, actor: Actor, target: Target, newRole: string) {
  if (!canManageMembers(standing)) throw forbidden("Only the startup's founders can change roles");
  if (target.userId === actor.id) throw forbidden("You cannot change your own role");
  if (standing !== PLATFORM && isOwnerRole(newRole)) {
    throw forbidden("Founder access is granted by a founder invitation, not a role change");
  }
  if (standing !== PLATFORM && isOwnerRole(target.role)) {
    throw forbidden("A founder's role can only be changed by DevUp");
  }
}

/** Throws unless `actor` may remove `target`. Founders are removed only by DevUp. */
export function assertCanRemove(standing: Standing, actor: Actor, target: Target) {
  if (!canManageMembers(standing)) throw forbidden("Only the startup's founders can remove members");
  if (target.userId === actor.id) throw forbidden("You cannot remove yourself");
  if (standing !== PLATFORM && isOwnerRole(target.role)) {
    throw forbidden("A founder can only be removed by DevUp");
  }
}

export { isOwnerRole };
