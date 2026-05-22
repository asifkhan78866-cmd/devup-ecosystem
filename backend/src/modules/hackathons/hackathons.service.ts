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
      prisma.hackathon.findMany({ where, skip, take: Number(limit), orderBy: { startDate: "asc" } }),
      prisma.hackathon.count({ where })
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getHackathon(id: string) {
    const hackathon = await prisma.hackathon.findUnique({ where: { id } });
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

  async register(id: string, userId: string, data: any) {
    const hackathon = await prisma.hackathon.findUnique({ where: { id } });
    if (!hackathon || !hackathon.isActive) throw new AppError(404, "Hackathon not found or inactive");

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
}
