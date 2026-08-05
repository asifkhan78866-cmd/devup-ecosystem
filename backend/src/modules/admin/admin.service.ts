import { prisma } from "../../lib/prisma";

export class AdminService {
  async getStats() {
    const now = new Date();

    // --- Core counts ---
    const [
      totalUsers,
      totalStartups,
      totalApplications,
      totalJobs,
      activeHackathons,
      pendingServiceRequests,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.startup.count({ where: { isActive: true, isVerified: true } }),
      prisma.application.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.hackathon.count({ where: { isActive: true } }),
      prisma.serviceRequest.count({ where: { status: "PENDING" } }),
    ]);

    // --- Trends ---
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      startupsThisWeek,
      startupsLastWeek,
      applicationsToday,
      usersThisMonth,
      usersLastMonth,
    ] = await Promise.all([
      prisma.startup.count({
        where: { isActive: true, isVerified: true, createdAt: { gte: startOfThisWeek } },
      }),
      prisma.startup.count({
        where: {
          isActive: true,
          isVerified: true,
          createdAt: { gte: startOfLastWeek, lt: startOfThisWeek },
        },
      }),
      prisma.application.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      prisma.user.count({
        where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
      }),
    ]);

    const pct = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? "+100%" : "0%";
      const change = Math.round(((curr - prev) / prev) * 100);
      return change >= 0 ? `+${change}%` : `${change}%`;
    };

    const trends = {
      startupsTrend: {
        value: `${pct(startupsThisWeek, startupsLastWeek)} this week`,
        up: startupsThisWeek >= startupsLastWeek,
      },
      applicationsTrend: {
        value: `${applicationsToday} new today`,
        up: applicationsToday > 0,
      },
      usersTrend: {
        value: `${pct(usersThisMonth, usersLastMonth)} this month`,
        up: usersThisMonth >= usersLastMonth,
      },
    };

    // --- Applications chart (last 30 days) ---
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const applicationsByDay = await prisma.$queryRaw<
      Array<{ date: string; submitted: bigint; approved: bigint }>
    >`
      SELECT to_char(d::date, 'Mon DD') AS date,
             COALESCE(sub.submitted, 0)  AS submitted,
             COALESCE(sub.approved, 0)   AS approved
      FROM generate_series(${thirtyDaysAgo}::date, ${now}::date, '1 day') d
      LEFT JOIN (
        SELECT "createdAt"::date AS day,
               count(*)                                      AS submitted,
               count(*) FILTER (WHERE "status" = 'APPROVED') AS approved
        FROM "Application"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY 1
      ) sub ON sub.day = d::date
      ORDER BY d
    `;

    // --- Signups chart (last 12 weeks) ---
    const twelveWeeksAgo = new Date(now);
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const signupsByWeek = await prisma.$queryRaw<
      Array<{ week: string; students: bigint; founders: bigint }>
    >`
      SELECT 'W' || ROW_NUMBER() OVER (ORDER BY w) AS week,
             COALESCE(sub.students, 0)              AS students,
             COALESCE(sub.founders, 0)              AS founders
      FROM generate_series(${twelveWeeksAgo}::date, ${now}::date, '7 days') w
      LEFT JOIN (
        SELECT date_trunc('week', "createdAt")::date AS wk,
               count(*) FILTER (WHERE "role" = 'STUDENT')  AS students,
               count(*) FILTER (WHERE "role" = 'FOUNDER')  AS founders
        FROM "User"
        WHERE "createdAt" >= ${twelveWeeksAgo}
        GROUP BY 1
      ) sub ON sub.wk = w::date
      ORDER BY w
    `;

    // --- Recent activity from AuditLog ---
    const recentLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const colorMap: Record<string, string> = {
      Application: "bg-indigo-500",
      User: "bg-blue-500",
      Startup: "bg-emerald-500",
      Job: "bg-purple-500",
      Document: "bg-orange-500",
      Hackathon: "bg-pink-500",
    };

    const recentActivity = recentLogs.map((log) => ({
      text: `${log.action} — ${log.entity}${log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}`,
      time: timeAgo(log.createdAt),
      color: colorMap[log.entity] || "bg-gray-500",
    }));

    return {
      totalUsers,
      totalStartups,
      totalApplications,
      totalJobs,
      activeHackathons,
      pendingServiceRequests,
      trends,
      applicationsByDay: applicationsByDay.map((r) => ({
        date: r.date,
        submitted: Number(r.submitted),
        approved: Number(r.approved),
      })),
      signupsByWeek: signupsByWeek.map((r) => ({
        week: r.week,
        students: Number(r.students),
        founders: Number(r.founders),
      })),
      recentActivity,
    };
  }

  async getAuditLogs(query: any) {
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({ skip, take: Number(limit), orderBy: { createdAt: "desc" } }),
      prisma.auditLog.count(),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async logAction(adminId: string, action: string, entity: string, entityId?: string, metadata?: any) {
    return await prisma.auditLog.create({
      data: { adminId, action, entity, entityId, metadata }
    });
  }
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
