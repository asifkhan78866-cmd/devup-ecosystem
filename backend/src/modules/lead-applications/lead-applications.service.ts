import { prisma } from "../../lib/prisma";
import { LeadApplication, LeadershipRole, LeadershipAppStatus } from "@prisma/client";
import { env } from "../../config/env";
import { EmailTemplates, MAIL_FROM, resend } from "../../lib/resend";
import { logger } from "../../middleware/logger";

export interface CreateLeadAppInput {
  role: LeadershipRole;
  fullName: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  college: string;
  branch?: string;
  yearOfStudy?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  portfolioUrl?: string;
  whyLead: string;
  pastExperience?: string;
  first30DaysPlan?: string;
}

export class LeadApplicationsService {
  private roleLabel(role: LeadershipRole): string {
    return role
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  }

  private statusLabel(status: LeadershipAppStatus): string {
    return status
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Email is best-effort: a delivery-provider issue must never make a saved
   * application look unsuccessful to the applicant.
   */
  private async sendApplicationReceivedEmails(application: LeadApplication) {
    const role = this.roleLabel(application.role);
    const results = await Promise.allSettled([
      resend.emails.send({
        from: MAIL_FROM,
        to: application.email,
        subject: "We received your Lead DevUp application",
        html: EmailTemplates.leadApplicationReceived({
          applicantName: application.fullName,
          applicationNo: application.applicationNo,
          role,
        }),
      }),
      resend.emails.send({
        from: MAIL_FROM,
        to: env.RESEND_TEAM_EMAIL,
        subject: `[New Lead Application] ${application.fullName} — ${role}`,
        html: EmailTemplates.newLeadApplicationForTeam({
          applicationNo: application.applicationNo,
          applicantName: application.fullName,
          email: application.email,
          phone: application.phone,
          role,
          state: application.state,
          city: application.city,
          college: application.college,
          branch: application.branch,
          yearOfStudy: application.yearOfStudy,
          linkedinUrl: application.linkedinUrl,
          githubUrl: application.githubUrl,
          twitterUrl: application.twitterUrl,
          portfolioUrl: application.portfolioUrl,
          whyLead: application.whyLead,
          pastExperience: application.pastExperience,
          first30DaysPlan: application.first30DaysPlan,
        }),
      }),
    ]);

    results.forEach((result) => {
      if (result.status === "rejected") {
        logger.error(`Lead application email failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
      } else if (result.value.error) {
        logger.error(`Lead application email delivery failed: ${result.value.error.message}`);
      }
    });
  }

  private async sendStatusUpdateEmail(application: LeadApplication) {
    const role = this.roleLabel(application.role);
    const status = this.statusLabel(application.status);

    try {
      const { error: deliveryError } = await resend.emails.send({
        from: MAIL_FROM,
        to: application.email,
        subject: `Lead DevUp application update: ${status}`,
        html: EmailTemplates.leadApplicationStatusUpdate({
          applicantName: application.fullName,
          applicationNo: application.applicationNo,
          role,
          status: application.status,
        }),
      });
      if (deliveryError) {
        logger.error(`Lead application status email delivery failed: ${deliveryError.message}`);
      }
    } catch (error) {
      logger.error(`Lead application status email failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private generateApplicationNo(): string {
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `DEVUP-LEAD-${timestamp}-${randomHex}`;
  }

  async createApplication(data: CreateLeadAppInput) {
    const applicationNo = this.generateApplicationNo();
    const application = await prisma.leadApplication.create({
      data: {
        applicationNo,
        role: data.role,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        state: data.state,
        city: data.city,
        college: data.college,
        branch: data.branch || null,
        yearOfStudy: data.yearOfStudy || null,
        linkedinUrl: data.linkedinUrl || null,
        githubUrl: data.githubUrl || null,
        twitterUrl: data.twitterUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        whyLead: data.whyLead,
        pastExperience: data.pastExperience || null,
        first30DaysPlan: data.first30DaysPlan || null,
        status: LeadershipAppStatus.PENDING,
      },
    });
    await this.sendApplicationReceivedEmails(application);
    return application;
  }

  async getApplications(filters?: { role?: LeadershipRole; status?: LeadershipAppStatus; search?: string }) {
    const where: any = {};
    if (filters?.role) where.role = filters.role;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { college: { contains: filters.search, mode: "insensitive" } },
        { city: { contains: filters.search, mode: "insensitive" } },
        { state: { contains: filters.search, mode: "insensitive" } },
        { applicationNo: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.leadApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getApplicationById(id: string) {
    return prisma.leadApplication.findUnique({
      where: { id },
    });
  }

  async updateStatus(id: string, status: LeadershipAppStatus, reviewNotes?: string, reviewedBy?: string) {
    const existing = await prisma.leadApplication.findUnique({
      where: { id },
      select: { status: true },
    });

    const application = await prisma.leadApplication.update({
      where: { id },
      data: {
        status,
        reviewNotes: reviewNotes || undefined,
        reviewedBy: reviewedBy || undefined,
      },
    });

    // Saving a note alone is an internal admin action. Applicants hear only
    // when their actual status changes; review notes stay private.
    if (existing && existing.status !== application.status) {
      await this.sendStatusUpdateEmail(application);
    }

    return application;
  }
}
