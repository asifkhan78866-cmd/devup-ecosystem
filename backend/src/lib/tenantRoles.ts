/**
 * Single definition of which StartupMember roles may do what.
 *
 * These were previously written inline as `['OWNER','ADMIN']` in a dozen
 * services. When existing owners were migrated to FOUNDER, every one of those
 * checks silently started returning 403 for the actual owner of the startup.
 * Keeping the lists here means a future role change is one edit, not twelve.
 */

/** Top authority. FOUNDER and OWNER are equivalent — both exist for history. */
export const OWNER_ROLES = ["OWNER", "FOUNDER"] as const;

/** May change the startup itself: details, logo, jobs, documents, members. */
export const MANAGE_ROLES = ["OWNER", "FOUNDER", "ADMIN"] as const;

/** May see and act on candidates. */
export const HIRING_ROLES = ["OWNER", "FOUNDER", "ADMIN", "HR", "RECRUITER"] as const;

/** May view candidate data, including managers who sit on interview panels. */
export const VIEW_APPLICANT_ROLES = [
  "OWNER", "FOUNDER", "ADMIN", "HR", "RECRUITER", "MANAGER",
] as const;

/** Anyone attached to the startup in any capacity. */
export const ANY_MEMBER_ROLES = [
  "OWNER", "FOUNDER", "ADMIN", "HR", "RECRUITER", "MANAGER", "EMPLOYEE", "INTERN", "MEMBER",
] as const;

type Member = { role: string };

const has = (roles: readonly string[], members?: Member[] | null) =>
  Boolean(members?.some((m) => roles.includes(m.role)));

export const isOwner = (members?: Member[] | null) => has(OWNER_ROLES, members);
export const canManageStartup = (members?: Member[] | null) => has(MANAGE_ROLES, members);
export const canHire = (members?: Member[] | null) => has(HIRING_ROLES, members);
export const canViewApplicants = (members?: Member[] | null) => has(VIEW_APPLICANT_ROLES, members);
export const isAnyMember = (members?: Member[] | null) => has(ANY_MEMBER_ROLES, members);
