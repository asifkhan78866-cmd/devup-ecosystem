import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { uploadFile } from "../../lib/storage";
import { env } from "../../config/env";

export class UsersService {
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { 
        profile: true,
        startupMemberships: {
          where: { status: "ACTIVE" },
          include: { startup: true }
        }
      },
    });
    if (!user) throw new AppError(404, "User not found");
    return user;
  }

  async getAllUsers(limit: number = 100) {
    const users = await prisma.user.findMany({
      take: limit,
      include: { profile: true },
      orderBy: { createdAt: 'desc' }
    });
    return users;
  }

  async updateUser(id: string, requesterId: string, data: any) {
    if (id !== requesterId) {
      const requester = await prisma.user.findUnique({ where: { id: requesterId } });
      if (requester?.role !== "ADMIN") {
        throw new AppError(403, "Not authorized to update this user");
      }
    }

    const profile = await prisma.profile.upsert({
      where: { userId: id },
      update: data,
      create: {
        userId: id,
        name: data.name || "Unknown",
        ...data,
      },
    });

    return profile;
  }

  async uploadResume(id: string, requesterId: string, fileBuffer: Buffer, mimetype: string) {
    if (id !== requesterId) {
      throw new AppError(403, "Not authorized to upload resume for this user");
    }

    const path = `${id}/resume-${Date.now()}.pdf`;
    const url = await uploadFile(env.STORAGE_BUCKET_RESUMES, path, fileBuffer, mimetype);

    const profile = await prisma.profile.upsert({
      where: { userId: id },
      update: { resumeUrl: url },
      create: { userId: id, name: "Unknown", resumeUrl: url },
    });

    return profile;
  }

  async getUserApplications(id: string, requesterId: string) {
    if (id !== requesterId) {
      throw new AppError(403, "Not authorized to view these applications");
    }

    return await prisma.jobApplication.findMany({
      where: { userId: id },
      include: { job: { include: { startup: true } } },
      orderBy: { appliedAt: "desc" },
    });
  }

  async getUserNotifications(id: string, requesterId: string) {
    if (id !== requesterId) {
      throw new AppError(403, "Not authorized to view these notifications");
    }

    return await prisma.notification.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    });
  }
}
