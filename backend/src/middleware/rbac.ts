import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

// ─── PERMISSION CONSTANTS ─────────────────────────
export const Permissions = {
  // Public
  VIEW_PUBLIC: "view:public",

  // Hackathons
  APPLY_HACKATHON: "apply:hackathon",
  EVALUATE_HACKATHON: "evaluate:hackathon",
  MANAGE_HACKATHONS: "manage:hackathons",

  // Startups
  BROWSE_STARTUPS: "browse:startups",
  CREATE_STARTUP: "create:startup",
  MANAGE_STARTUP: "manage:startup",
  MANAGE_OWN_STARTUP: "manage:own_startup",
  VIEW_VERIFIED_STARTUPS: "view:verified_startups",
  CONTACT_FOUNDERS: "contact:founders",
  REVIEW_STARTUPS: "review:startups",

  // Founders
  BROWSE_FOUNDERS: "browse:founders",
  INVITE_MEMBERS: "invite:members",
  POST_JOBS: "post:jobs",

  // Users
  MANAGE_USERS: "manage:users",
  APPROVE_FOUNDERS: "approve:founders",
  APPROVE_STARTUPS: "approve:startups",

  // Mentors
  SCHEDULE_MEETINGS: "schedule:meetings",

  // Admin
  ADMIN_PANEL: "access:admin",
  SUPER_ADMIN: "access:super_admin",
} as const;

type Permission = (typeof Permissions)[keyof typeof Permissions];

// ─── ROLE → PERMISSIONS MAP ───────────────────────
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  STUDENT: [
    Permissions.VIEW_PUBLIC,
    Permissions.APPLY_HACKATHON,
    Permissions.BROWSE_STARTUPS,
    Permissions.BROWSE_FOUNDERS,
  ],

  FOUNDER: [
    Permissions.VIEW_PUBLIC,
    Permissions.APPLY_HACKATHON,
    Permissions.BROWSE_STARTUPS,
    Permissions.BROWSE_FOUNDERS,
    Permissions.CREATE_STARTUP,
    Permissions.MANAGE_STARTUP,
    Permissions.INVITE_MEMBERS,
    Permissions.POST_JOBS,
    Permissions.CONTACT_FOUNDERS,
  ],

  STARTUP_MEMBER: [
    Permissions.VIEW_PUBLIC,
    Permissions.BROWSE_STARTUPS,
    Permissions.BROWSE_FOUNDERS,
    Permissions.MANAGE_OWN_STARTUP,
  ],

  MENTOR: [
    Permissions.VIEW_PUBLIC,
    Permissions.BROWSE_STARTUPS,
    Permissions.BROWSE_FOUNDERS,
    Permissions.REVIEW_STARTUPS,
    Permissions.SCHEDULE_MEETINGS,
  ],

  JUDGE: [
    Permissions.VIEW_PUBLIC,
    Permissions.BROWSE_STARTUPS,
    Permissions.EVALUATE_HACKATHON,
  ],

  INVESTOR: [
    Permissions.VIEW_PUBLIC,
    Permissions.BROWSE_STARTUPS,
    Permissions.BROWSE_FOUNDERS,
    Permissions.VIEW_VERIFIED_STARTUPS,
    Permissions.CONTACT_FOUNDERS,
  ],

  ADMIN: [
    Permissions.VIEW_PUBLIC,
    Permissions.APPLY_HACKATHON,
    Permissions.BROWSE_STARTUPS,
    Permissions.BROWSE_FOUNDERS,
    Permissions.CREATE_STARTUP,
    Permissions.MANAGE_STARTUP,
    Permissions.MANAGE_OWN_STARTUP,
    Permissions.INVITE_MEMBERS,
    Permissions.POST_JOBS,
    Permissions.CONTACT_FOUNDERS,
    Permissions.REVIEW_STARTUPS,
    Permissions.EVALUATE_HACKATHON,
    Permissions.MANAGE_HACKATHONS,
    Permissions.MANAGE_USERS,
    Permissions.APPROVE_FOUNDERS,
    Permissions.APPROVE_STARTUPS,
    Permissions.SCHEDULE_MEETINGS,
    Permissions.VIEW_VERIFIED_STARTUPS,
    Permissions.ADMIN_PANEL,
  ],

  SUPER_ADMIN: [
    // Everything
    ...Object.values(Permissions),
  ],
};

// ─── HELPER ───────────────────────────────────────
export function hasPermission(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// ─── MIDDLEWARE ────────────────────────────────────
export const requirePermission = (...permissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "Not authorized", "UNAUTHORIZED"));
    }

    const userRole = req.user.role;
    const userPerms = ROLE_PERMISSIONS[userRole] || [];
    const hasAll = permissions.every((p) => userPerms.includes(p));

    if (!hasAll) {
      return next(
        new AppError(
          403,
          `Forbidden: requires ${permissions.join(", ")}`,
          "INSUFFICIENT_PERMISSIONS"
        )
      );
    }

    next();
  };
};
