import { prisma } from "../../lib/prisma";

export class AdminService {
  async getStats() {
    const [
      totalUsers,
      totalStartups,
      totalApplications,
      totalJobs,
      activeHackathons,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.startup.count({ where: { isActive: true, isVerified: true } }),
      prisma.application.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.hackathon.count({ where: { isActive: true } }),
    ]);

    // Calculate total funding dynamically if needed, or return placeholder
    const totalFunding = "$2.4B"; 

    return {
      totalUsers,
      totalStartups,
      totalApplications,
      totalJobs,
      activeHackathons,
      totalFunding,
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
