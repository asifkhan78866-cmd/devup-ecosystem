import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as analytics from "./analytics.service";
import { prisma } from "../../lib/prisma";

const router = Router();
const ok = (res: any, data: unknown) => res.json({ success: true, data });

// Platform-wide figures. Aggregates only — never applicant PII.
router.use(requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]));

router.get("/overview", async (_req, res) => ok(res, await analytics.platformOverview()));
router.get("/comparison", async (_req, res) => ok(res, await analytics.startupComparison()));
router.get("/funnel", async (_req, res) => ok(res, await analytics.platformFunnel()));
router.get("/colleges", async (_req, res) => ok(res, await analytics.platformColleges()));

router.get("/trends", async (req, res) => {
  const months = Number(req.query.months) || 6;
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const rows = await prisma.$queryRaw<Array<{ month: string; applications: bigint; hired: bigint }>>`
    SELECT to_char(date_trunc('month', "appliedAt"), 'YYYY-MM') AS month,
           count(*)                                             AS applications,
           count(*) FILTER (WHERE "outcome" = 'HIRED')          AS hired
    FROM "JobApplication"
    WHERE "appliedAt" >= ${since}
    GROUP BY 1 ORDER BY 1
  `;

  ok(
    res,
    rows.map((r) => ({
      month: r.month,
      applications: Number(r.applications),
      hired: Number(r.hired),
    }))
  );
});

router.get("/audit", async (req, res) => {
  const limit = Math.min(200, Number(req.query.limit) || 50);
  ok(
    res,
    await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(req.query.entity ? { where: { entity: String(req.query.entity) } } : {}),
    })
  );
});

export default router;
