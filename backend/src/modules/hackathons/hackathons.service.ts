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

  async createLead(hackathonId: string, data: { name: string; phone: string; teamCount: number; college: string }) {
    const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon?.isActive) {
      throw new AppError(404, "Hackathon not found or inactive", "HACKATHON_NOT_FOUND");
    }

    if (hackathon.registrationDeadline < new Date()) {
      throw new AppError(400, "Registration deadline has passed");
    }

    const lead = await prisma.hackathonLead.create({
      data: {
        hackathonId,
        name: data.name,
        phone: data.phone,
        teamCount: data.teamCount,
        college: data.college,
        source: "website",
      },
    });

    return lead;
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
}
