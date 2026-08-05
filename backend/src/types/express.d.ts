import { User, StartupMemberRole } from "@prisma/client";
import { TenantDb } from "../lib/tenantPrisma";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      /** Resolved by middleware/tenant.ts — never read from the request body. */
      startupId?: string;
      startup?: { id: string; code: string | null; name: string; isActive: boolean; logoUrl: string | null };
      tenantRole?: StartupMemberRole | "SUPER_ADMIN";
      /** Prisma client hard-scoped to req.startupId. */
      db?: TenantDb;
    }
  }
}
