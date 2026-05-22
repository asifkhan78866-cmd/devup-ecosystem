import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { resend, EmailTemplates } from "../../lib/resend";
import { env } from "../../config/env";

export class JobsService {
  async getJobs(query: any) {
    const { page = 1, limit = 10, type, domain, search } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isActive: true };
    if (type) where.type = type;
    if (domain) where.domain = domain;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.job.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: "desc" }, include: { startup: { select: { id: true, name: true, logoUrl: true } } } }),
      prisma.job.count({ where })
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getJob(id: string) {
    const job = await prisma.job.findUnique({ where: { id }, include: { startup: true } });
    if (!job) throw new AppError(404, "Job not found");
    return job;
  }

  async createJob(userId: string, role: string, data: any) {
    const startup = await prisma.startup.findUnique({ where: { id: data.startupId }, include: { founders: true } });
    if (!startup) throw new AppError(404, "Startup not found");

    if (role !== "ADMIN" && !startup.founders.some(f => f.id === userId)) {
      throw new AppError(403, "Not authorized to post a job for this startup");
    }

    return await prisma.job.create({ data });
  }

  async updateJob(id: string, userId: string, role: string, data: any) {
    const job = await prisma.job.findUnique({ where: { id }, include: { startup: { include: { founders: true } } } });
    if (!job) throw new AppError(404, "Job not found");

    if (role !== "ADMIN" && !job.startup.founders.some(f => f.id === userId)) {
      throw new AppError(403, "Not authorized to update this job");
    }

    return await prisma.job.update({ where: { id }, data });
  }

  async deleteJob(id: string, userId: string, role: string) {
    const job = await prisma.job.findUnique({ where: { id }, include: { startup: { include: { founders: true } } } });
    if (!job) throw new AppError(404, "Job not found");

    if (role !== "ADMIN" && !job.startup.founders.some(f => f.id === userId)) {
      throw new AppError(403, "Not authorized to delete this job");
    }

    return await prisma.job.delete({ where: { id } });
  }

  async applyForJob(jobId: string, userId: string, data: any) {
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { startup: { include: { primaryFounder: true } } } });
    if (!job || !job.isActive) throw new AppError(404, "Job not found or inactive");

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile?.resumeUrl) throw new AppError(400, "Please upload a resume to your profile before applying");

    const existingApplication = await prisma.jobApplication.findUnique({
      where: { jobId_userId: { jobId, userId } }
    });

    if (existingApplication) throw new AppError(400, "You have already applied for this job");

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        userId,
        resumeUrl: profile.resumeUrl,
        coverLetter: data.coverLetter
      }
    });

    // Notify startup founder
    if (job.startup.primaryFounder?.email) {
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: job.startup.primaryFounder.email,
        subject: "New Job Application - DevUp Ecosystem",
        html: EmailTemplates.jobApplicationReceived(profile.name, job.title)
      }).catch(err => console.error("Email error:", err));
    }

    return application;
  }
}
