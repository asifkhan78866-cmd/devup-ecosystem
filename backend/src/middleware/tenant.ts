import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";
import { prisma } from "../lib/prisma";
import { tenantScoped } from "../lib/tenantPrisma";
import { StartupMemberRole } from "@prisma/client";

/**
 * Resolves :code to a startup and proves the caller belongs to it.
 *
 * Non-members get 404 rather than 403 on purpose: a 403 confirms the startup
 * exists and that you are not in it, which lets anyone enumerate tenants from
 * short guessable codes like ZAP or DIA.
 */
export const resolveTenant = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, "Not authorized", "UNAUTHORIZED");

    const code = String(req.params.code || "").toUpperCase();
    if (!/^[A-Z0-9]{2,5}$/.test(code)) throw new AppError(404, "Startup not found", "NOT_FOUND");

    const startup = await prisma.startup.findUnique({
      where: { code },
      select: { id: true, code: true, name: true, isActive: true, logoUrl: true },
    });
    if (!startup) throw new AppError(404, "Startup not found", "NOT_FOUND");

    const isPlatformAdmin = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN";

    if (isPlatformAdmin) {
      req.tenantRole = "SUPER_ADMIN";
    } else {
      const membership = await prisma.startupMember.findFirst({
        where: { startupId: startup.id, userId: req.user.id, status: "ACTIVE" },
        select: { role: true },
      });
      if (!membership) throw new AppError(404, "Startup not found", "NOT_FOUND");
      req.tenantRole = membership.role;
    }

    // Deactivated tenants are readable by platform admins only.
    if (!startup.isActive && !isPlatformAdmin) {
      throw new AppError(403, "This startup is not active", "STARTUP_INACTIVE");
    }

    req.startupId = startup.id;
    req.startup = startup;
    req.db = tenantScoped(startup.id);
    next();
  } catch (err) {
    next(err);
  }
};

export type TenantRole = StartupMemberRole | "SUPER_ADMIN";

/** Ordered most privileged first. Used for "this role or above" checks. */
const HIERARCHY: TenantRole[] = [
  "SUPER_ADMIN",
  "FOUNDER",
  "OWNER",
  "ADMIN",
  "HR",
  "RECRUITER",
  "MANAGER",
  "EMPLOYEE",
  "INTERN",
  "MEMBER",
];

export function rank(role: TenantRole) {
  const i = HIERARCHY.indexOf(role);
  return i === -1 ? HIERARCHY.length : i;
}

/** Caller must hold one of these tenant roles exactly. */
export const requireTenantRole = (...roles: TenantRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.tenantRole) return next(new AppError(401, "Tenant not resolved", "UNAUTHORIZED"));
    if (!roles.includes(req.tenantRole)) {
      return next(new AppError(403, "Insufficient permissions for this startup", "FORBIDDEN"));
    }
    next();
  };
};

/** Caller must be at least as privileged as `role`. */
export const requireTenantRank = (role: TenantRole) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.tenantRole) return next(new AppError(401, "Tenant not resolved", "UNAUTHORIZED"));
    if (rank(req.tenantRole) > rank(role)) {
      return next(new AppError(403, "Insufficient permissions for this startup", "FORBIDDEN"));
    }
    next();
  };
};
