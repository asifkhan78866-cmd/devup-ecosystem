import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { uploadFile } from "../../lib/storage";
import { env } from "../../config/env";
import { resend, EmailTemplates } from "../../lib/resend";
import { ApplicationStatus, Role } from "@prisma/client";
import { randomBytes } from "crypto";

export class ApplicationsService {
  async submitApplication(userId: string, data: any) {
    const application = await prisma.application.create({
      data: {
        ...data,
        submittedBy: userId,
      }
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    
    // Attempt to send email
    if (user?.email) {
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: user.email,
        subject: "Application Received - DevUp Ecosystem",
        html: EmailTemplates.applicationReceived(user.profile?.name || "Founder", application.startupName)
      }).catch(err => console.error("Email error:", err));
    }

    return application;
  }

  async uploadPitchDeck(id: string, userId: string, fileBuffer: Buffer, mimetype: string) {
    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) throw new AppError(404, "Application not found");
    if (application.submittedBy !== userId) throw new AppError(403, "Not authorized");

    const path = `pitch-decks/${id}-${Date.now()}.pdf`;
    const url = await uploadFile(env.STORAGE_BUCKET_PITCHDECKS, path, fileBuffer, mimetype);

    return await prisma.application.update({
      where: { id },
      data: { pitchDeckUrl: url }
    });
  }

  async getApplications(query: any) {
    const { status, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where = status ? { status: status as ApplicationStatus } : {};

    const [data, total] = await Promise.all([
      prisma.application.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: "desc" } }),
      prisma.application.count({ where })
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getApplication(id: string, userId: string, role: string) {
    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) throw new AppError(404, "Application not found");
    
    if (role !== "ADMIN" && application.submittedBy !== userId) {
      throw new AppError(403, "Not authorized");
    }

    return application;
  }

  async reviewApplication(id: string, adminId: string, data: any) {
    const application = await prisma.application.update({
      where: { id },
      data: {
        status: data.status,
        reviewNotes: data.reviewNotes,
        reviewedBy: adminId,
      }
    });

    const user = await prisma.user.findUnique({ where: { id: application.submittedBy }, include: { profile: true } });

    if (user?.email) {
      if (data.status === "APPROVED") {
        const slug = application.startupName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + randomBytes(4).toString('hex');
        
        const startup = await prisma.startup.create({
          data: {
            name: application.startupName,
            slug,
            tagline: application.oneLiner,
            description: application.oneLiner,
            domain: application.domain,
            stage: application.stage,
            foundedYear: new Date().getFullYear(),
            headcount: application.userCount || "1-5",
            location: "Global",
            isVerified: true,
            verifiedAt: new Date(),
            verifiedBy: adminId,
            founderId: application.submittedBy,
          },
        });

        await prisma.startupMember.create({
          data: {
            startupId: startup.id,
            userId: application.submittedBy,
            email: user.email,
            role: "Founder",
            status: "ACTIVE",
            invitedBy: adminId,
            inviteToken: randomBytes(24).toString("hex"),
            joinedAt: new Date(),
          },
        });

        if (user.role === Role.STUDENT) {
          await prisma.user.update({
            where: { id: application.submittedBy },
            data: { role: Role.FOUNDER },
          });
        }

        await prisma.auditLog.create({
          data: {
            adminId,
            action: "APPROVE_APPLICATION",
            entity: "Startup",
            entityId: startup.id,
            metadata: { applicationId: id },
          },
        });

        await prisma.notification.create({
          data: {
            userId: application.submittedBy,
            title: "Your startup is verified! 🎉",
            message: `${startup.name} is now live on DevUp Ecosystem.`,
            type: "STARTUP_VERIFIED",
            link: "/dashboard",
          },
        });

        await resend.emails.send({
          from: env.RESEND_FROM_EMAIL,
          to: user.email,
          subject: "Application Approved! - DevUp Ecosystem",
          html: EmailTemplates.applicationApproved(user.profile?.name || "Founder", application.startupName, `${env.FRONTEND_URL}/dashboard`)
        }).catch(err => console.error("Email error:", err));
        
      } else if (data.status === "REJECTED") {
        await resend.emails.send({
          from: env.RESEND_FROM_EMAIL,
          to: user.email,
          subject: "Application Update - DevUp Ecosystem",
          html: EmailTemplates.applicationRejected(user.profile?.name || "Founder", application.startupName, data.reviewNotes || "After careful consideration, we decided not to proceed.")
        }).catch(err => console.error("Email error:", err));
      }
    }

    return application;
  }
}
