import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { uploadFile } from "../../lib/storage";
import { env } from "../../config/env";

export class HackathonsService {
  async getHackathons(query: any) {
    const { page = 1, limit = 10, mode, search } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isActive: true };
    if (mode) where.mode = mode;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.hackathon.findMany({ 
        where, 
        skip, 
        take: Number(limit), 
        orderBy: { startDate: "asc" },
        include: { _count: { select: { leads: true } } }
      }),
      prisma.hackathon.count({ where })
    ]);

  const pageNumber = Number(page);
  const pageLimit = Number(limit);
  const totalPages = Math.ceil(total / pageLimit);

  return { data, meta: { total, page: pageNumber, limit: pageLimit, totalPages } };
  }

  async getFeaturedHackathon() {
    const hackathon = await prisma.hackathon.findFirst({
      where: { isFeatured: true, isActive: true },
      orderBy: { startDate: "desc" },
      include: {
        partners: { orderBy: { order: "asc" } },
      },
    });
    return hackathon;
  }

  async getHackathon(id: string) {
    const hackathon = await prisma.hackathon.findUnique({
      where: { id },
      include: {
        partners: { orderBy: { order: "asc" } },
      },
    });
    if (!hackathon) throw new AppError(404, "Hackathon not found");
    return hackathon;
  }

  async createHackathon(data: any) {
    return await prisma.hackathon.create({ data });
  }

  async updateHackathon(id: string, data: any) {
    return await prisma.hackathon.update({ where: { id }, data });
  }

  async deleteHackathon(id: string) {
    return await prisma.hackathon.delete({ where: { id } });
  }

  async uploadImage(id: string, type: "logo" | "banner", fileBuffer: Buffer, mimetype: string) {
    const bucket = type === "logo" ? env.STORAGE_BUCKET_LOGOS : env.STORAGE_BUCKET_BANNERS; // Reuse startup buckets or create separate
    const path = `hackathons/${id}/${type}-${Date.now()}`;
    const url = await uploadFile(bucket, path, fileBuffer, mimetype);

    return await prisma.hackathon.update({
      where: { id },
      data: type === "logo" ? { logoUrl: url } : { bannerUrl: url }
    });
  }

  async createPartner(hackathonId: string, data: { name: string; order?: number }) {
    return await prisma.hackathonPartner.create({
      data: {
        hackathonId,
        name: data.name,
        order: data.order ?? 0,
      },
    });
  }

  async updatePartner(hackathonId: string, partnerId: string, data: { name?: string; order?: number }) {
    return await prisma.hackathonPartner.update({
      where: { id: partnerId, hackathonId },
      data,
    });
  }

  async deletePartner(hackathonId: string, partnerId: string) {
    return await prisma.hackathonPartner.delete({
      where: { id: partnerId, hackathonId },
    });
  }

  async uploadPartnerLogo(hackathonId: string, partnerId: string, fileBuffer: Buffer, mimetype: string) {
    const bucket = env.STORAGE_BUCKET_LOGOS;
    const path = `hackathons/${hackathonId}/partners/${partnerId}-${Date.now()}`;
    const url = await uploadFile(bucket, path, fileBuffer, mimetype);

    return await prisma.hackathonPartner.update({
      where: { id: partnerId, hackathonId },
      data: { logoUrl: url },
    });
  }

  async register(id: string, userId: string, data: any) {
    const hackathon = await prisma.hackathon.findUnique({ where: { id } });
    if (!hackathon?.isActive) {
      throw new AppError(404, "Hackathon not found or inactive", "HACKATHON_NOT_FOUND");
    }

    if (hackathon.registrationDeadline < new Date()) {
      throw new AppError(400, "Registration deadline has passed");
    }

    if (hackathon.maxParticipants && hackathon.currentParticipants >= hackathon.maxParticipants) {
      throw new AppError(400, "Hackathon is fully booked");
    }

    const existing = await prisma.hackathonRegistration.findUnique({
      where: { hackathonId_userId: { hackathonId: id, userId } }
    });

    if (existing) throw new AppError(400, "You are already registered for this hackathon");

    const reg = await prisma.hackathonRegistration.create({
      data: { hackathonId: id, userId, teamName: data.teamName, teamSize: data.teamSize }
    });

    await prisma.hackathon.update({
      where: { id },
      data: { currentParticipants: { increment: data.teamSize || 1 } }
    });

    return reg;
  }

  async createLead(hackathonId: string, data: { name: string; email?: string; phone: string; teamName?: string; teamCount: number; members?: { name: string; email: string; phone: string }[]; college: string }) {
    const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon?.isActive) {
      throw new AppError(404, "Hackathon not found or inactive", "HACKATHON_NOT_FOUND");
    }

    if (hackathon.registrationDeadline < new Date()) {
      throw new AppError(400, "Registration deadline has passed");
    }

    try {
      const lead = await prisma.hackathonLead.create({
        data: {
          hackathonId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          teamName: data.teamName,
          teamCount: data.teamCount,
          members: data.members ? JSON.stringify(data.members) : undefined,
          college: data.college,
          source: "website",
        },
      });

      return lead;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new AppError(400, "This phone number is already registered for this hackathon.");
      }
      throw error;
    }
  }

  async markLeadRedirected(leadId: string) {
    return await prisma.hackathonLead.update({
      where: { id: leadId },
      data: { redirectedAt: new Date() },
    });
  }

  async getLeads(hackathonId: string) {
    const [leads, total] = await Promise.all([
      prisma.hackathonLead.findMany({
        where: { hackathonId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.hackathonLead.count({ where: { hackathonId } }),
    ]);

    return { data: leads, meta: { total } };
  }

  async uploadSubmission(hackathonId: string, leadId: string, fileBuffer: Buffer, mimetype: string) {
    const lead = await prisma.hackathonLead.findUnique({
      where: { id: leadId },
      include: { hackathon: true, submission: true }
    });

    if (!lead || lead.hackathonId !== hackathonId) {
      throw new AppError(404, "Registration not found");
    }

    if (lead.hackathon.registrationDeadline < new Date()) {
       throw new AppError(400, "Submission deadline has passed");
    }

    if (lead.submission) {
      throw new AppError(400, "You have already submitted your pitch.");
    }

    const bucket = env.STORAGE_BUCKET_PITCHDECKS || "pitchdecks";
    const path = `hackathons/${hackathonId}/submissions/${leadId}-${Date.now()}`;
    const fileUrl = await uploadFile(bucket, path, fileBuffer, mimetype);

    const submission = await prisma.hackathonSubmission.create({
      data: {
        leadId,
        hackathonId,
        fileUrl,
        status: "PENDING"
      }
    });

    return submission;
  }

  async getSubmissionStatusByPhone(hackathonId: string, phone: string) {
    const lead = await prisma.hackathonLead.findUnique({
      where: { hackathonId_phone: { hackathonId, phone } },
      include: { submission: true }
    });
    
    if (!lead) throw new AppError(404, "No registration found for this phone number");
    
    return {
      id: lead.id,
      name: lead.name,
      teamCount: lead.teamCount,
      college: lead.college,
      submission: lead.submission
    };
  }

  async getAllSubmissions(hackathonId: string) {
    const [submissions, total] = await Promise.all([
      prisma.hackathonSubmission.findMany({
        where: { hackathonId },
        include: { lead: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.hackathonSubmission.count({ where: { hackathonId } })
    ]);
    return { data: submissions, meta: { total } };
  }

  async updateSubmissionStatus(hackathonId: string, submissionId: string, status: "PENDING" | "SELECTED" | "REJECTED") {
    return await prisma.hackathonSubmission.update({
      where: { id: submissionId, hackathonId },
      data: { status }
    });
  }
}
