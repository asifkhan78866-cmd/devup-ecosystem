import { prisma } from "../../lib/prisma";
import { DEFAULT_PIPELINE } from "../recruiting/pipeline/pipeline.service";

/**
 * Tenant dashboard. All queries are already scoped by the tenant client, and
 * every aggregate is a grouped query rather than one count per metric.
 */
export async function tenantDashboard(db: any, startupId: string) {
  const [jobs, stageGroups, outcomeGroups, interviews, offers, employees, interns, recent] =
    await Promise.all([
      db.job.groupBy({ by: ["status"], _count: { _all: true } }),
      db.jobApplication.groupBy({ by: ["stage"], where: { outcome: null }, _count: { _all: true } }),
      db.jobApplication.groupBy({ by: ["outcome"], _count: { _all: true } }),
      db.interview.count({ where: { scheduledAt: { gte: new Date() }, status: "SCHEDULED" } }),
      db.offerLetter.groupBy({ by: ["status"], _count: { _all: true } }),
      db.employee.count({ where: { status: "ACTIVE" } }),
      db.intern.count({ where: { status: "ACTIVE" } }),
      db.jobApplication.findMany({
        orderBy: { appliedAt: "desc" },
        take: 8,
        select: {
          id: true,
          applicationNo: true,
          applicantName: true,
          stage: true,
          appliedAt: true,
          job: { select: { title: true } },
        },
      }),
    ]);

  const byStage: Record<string, number> = {};
  for (const g of stageGroups) byStage[g.stage] = g._count._all;

  const byOutcome: Record<string, number> = {};
  for (const g of outcomeGroups) if (g.outcome) byOutcome[g.outcome] = g._count._all;

  const byJobStatus: Record<string, number> = {};
  for (const g of jobs) byJobStatus[g.status] = g._count._all;

  const totalApplications =
    Object.values(byStage).reduce((a, b) => a + b, 0) +
    Object.values(byOutcome).reduce((a, b) => a + b, 0);

  const hired = byOutcome.HIRED ?? 0;

  return {
    openPositions: byJobStatus.OPEN ?? 0,
    jobsByStatus: byJobStatus,
    totalApplications,
    inPipeline: Object.values(byStage).reduce((a, b) => a + b, 0),
    byStage,
    byOutcome,
    upcomingInterviews: interviews,
    offers: Object.fromEntries(offers.map((o: any) => [o.status, o._count._all])),
    activeEmployees: employees,
    activeInterns: interns,
    conversionRate: totalApplications ? Number(((hired / totalApplications) * 100).toFixed(1)) : 0,
    funnel: DEFAULT_PIPELINE.map((stage) => ({ stage, count: byStage[stage] ?? 0 })),
    recentApplications: recent,
  };
}

/** Monthly application and hire counts for the last `months` months. */
export async function tenantTrends(startupId: string, months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const rows = await prisma.$queryRaw<Array<{ month: string; applications: bigint; hired: bigint }>>`
    SELECT to_char(date_trunc('month', "appliedAt"), 'YYYY-MM') AS month,
           count(*)                                              AS applications,
           count(*) FILTER (WHERE "outcome" = 'HIRED')           AS hired
    FROM "JobApplication"
    WHERE "startupId" = ${startupId} AND "appliedAt" >= ${since}
    GROUP BY 1 ORDER BY 1
  `;

  return rows.map((r) => ({
    month: r.month,
    applications: Number(r.applications),
    hired: Number(r.hired),
  }));
}

export async function tenantColleges(startupId: string) {
  const rows = await prisma.jobApplication.groupBy({
    by: ["college"],
    where: { startupId, college: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { college: "desc" } },
    take: 15,
  });
  return rows.map((r) => ({ college: r.college, count: r._count._all }));
}

/**
 * Platform overview for Super Admin. Aggregates only — no applicant PII, since
 * the dashboard needs counts and rates, not resumes.
 */
export async function platformOverview() {
  const [startups, activeStartups, jobs, apps, outcomes, offers, employees, interns, interviews] =
    await Promise.all([
      prisma.startup.count(),
      prisma.startup.count({ where: { isActive: true } }),
      prisma.job.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.jobApplication.count(),
      prisma.jobApplication.groupBy({ by: ["outcome"], _count: { _all: true } }),
      prisma.offerLetter.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      prisma.intern.count({ where: { status: "ACTIVE" } }),
      prisma.interview.count(),
    ]);

  const byOutcome: Record<string, number> = {};
  for (const o of outcomes) if (o.outcome) byOutcome[o.outcome] = o._count._all;

  const byJobStatus: Record<string, number> = {};
  for (const j of jobs) byJobStatus[j.status] = j._count._all;

  const hired = byOutcome.HIRED ?? 0;

  return {
    totalStartups: startups,
    activeStartups,
    activeJobs: byJobStatus.OPEN ?? 0,
    totalApplications: apps,
    selectedCandidates: hired,
    rejectedCandidates: byOutcome.REJECTED ?? 0,
    offersGenerated: offers.reduce((a: number, o: any) => a + o._count._all, 0),
    offersAccepted: offers.find((o: any) => o.status === "ACCEPTED")?._count._all ?? 0,
    activeEmployees: employees,
    activeInterns: interns,
    totalInterviews: interviews,
    hiringConversionRate: apps ? Number(((hired / apps) * 100).toFixed(1)) : 0,
  };
}

export async function startupComparison() {
  const rows = await prisma.$queryRaw<
    Array<{ id: string; name: string; code: string | null; jobs: bigint; applications: bigint; hired: bigint }>
  >`
    SELECT s.id, s.name, s.code,
           count(DISTINCT j.id)                                 AS jobs,
           count(a.id)                                          AS applications,
           count(a.id) FILTER (WHERE a."outcome" = 'HIRED')     AS hired
    FROM "Startup" s
    LEFT JOIN "Job" j ON j."startupId" = s.id
    LEFT JOIN "JobApplication" a ON a."startupId" = s.id
    GROUP BY s.id, s.name, s.code
    ORDER BY applications DESC
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    jobs: Number(r.jobs),
    applications: Number(r.applications),
    hired: Number(r.hired),
    conversionRate: Number(r.applications)
      ? Number(((Number(r.hired) / Number(r.applications)) * 100).toFixed(1))
      : 0,
  }));
}

export async function platformFunnel() {
  const rows = await prisma.applicationStageEvent.groupBy({
    by: ["toStage"],
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.toStage] = r._count._all;
  return DEFAULT_PIPELINE.map((stage) => ({ stage, count: counts[stage] ?? 0 }));
}

export async function platformColleges() {
  const rows = await prisma.jobApplication.groupBy({
    by: ["college"],
    where: { college: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { college: "desc" } },
    take: 20,
  });
  return rows.map((r) => ({ college: r.college, count: r._count._all }));
}
