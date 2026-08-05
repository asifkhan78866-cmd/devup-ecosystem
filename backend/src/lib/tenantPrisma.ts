import { prisma } from "./prisma";

/**
 * Models that carry a startupId discriminator. Every query against these from a
 * tenant-scoped request is forced to that tenant, regardless of what the caller
 * wrote in their `where` clause.
 *
 * This is defence in depth: route middleware already verifies membership, but a
 * service that forgets to filter would otherwise leak across tenants. Here it
 * cannot — the filter is applied by the client itself.
 */
const TENANT_MODELS = new Set([
  "Job",
  "JobApplication",
  "ApplicationStageEvent",
  "Interview",
  "InterviewFeedback",
  "OfferLetter",
  "HrDocument",
  "Employee",
  "Intern",
  "Attendance",
  "PerformanceReview",
  "NumberSequence",
  "StartupBranding",
]);

const WHERE_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "updateMany",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

// Single-row writes address a row by unique id; re-checking tenancy afterwards is
// handled by the service, since Prisma rejects non-unique fields in these wheres.
const SINGLE_WRITE_OPS = new Set(["update", "delete"]);
const CREATE_OPS = new Set(["create", "createMany"]);

export type TenantDb = ReturnType<typeof tenantScoped>;

export function tenantScoped(startupId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_MODELS.has(model)) return query(args);

          const a = args as Record<string, any>;

          if (WHERE_OPS.has(operation)) {
            // findUnique cannot take non-unique fields in `where`; Prisma routes
            // those through findFirst semantics for us when we widen it here.
            if (operation === "findUnique" || operation === "findUniqueOrThrow") {
              a.where = { ...a.where, startupId };
              return (prisma as any)[lowerFirst(model)][
                operation === "findUnique" ? "findFirst" : "findFirstOrThrow"
              ]({ ...a });
            }
            a.where = { ...a.where, startupId };
          }

          if (SINGLE_WRITE_OPS.has(operation)) {
            // Guard the row belongs to this tenant before mutating it.
            const existing = await (prisma as any)[lowerFirst(model)].findFirst({
              where: { ...a.where, startupId },
              select: { id: true },
            });
            if (!existing) {
              const err: any = new Error(`${model} not found`);
              err.code = "TENANT_SCOPE_MISS";
              throw err;
            }
          }

          if (CREATE_OPS.has(operation)) {
            // startupId is always the resolved tenant — never whatever the body said.
            if (Array.isArray(a.data)) {
              a.data = a.data.map((d: any) => ({ ...d, startupId }));
            } else {
              a.data = { ...a.data, startupId };
            }
          }

          return query(a as any);
        },
      },
    },
  });
}

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
