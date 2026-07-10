import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { uploadFile } from "../../lib/storage";
import { env } from "../../config/env";
import { Prisma } from "@prisma/client";
import { createStartupOwnership } from "./ownership.service";

export class StartupsService {
  async getStartups(query: any) {
    const { page = 1, limit = 10, domain, stage, search } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.StartupWhereInput = {
      isActive: true,
      isVerified: true,
  ...(domain && { domain }),
  ...(stage && { stage }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } }
        ]
      })
    };

    const [data, total] = await Promise.all([
      prisma.startup.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: { primaryFounder: { select: { id: true, email: true, profile: { select: { name: true } } } } }
      }),
      prisma.startup.count({ where })
    ]);

  const pageNumber = Number(page);
  const pageLimit = Number(limit);
  const totalPages = Math.ceil(total / pageLimit);

  return { data, meta: { total, page: pageNumber, limit: pageLimit, totalPages } };
  }

  async getFeatured() {
    return await prisma.startup.findMany({
      where: { isFeatured: true, isActive: true, isVerified: true },
      take: 6,
      orderBy: { createdAt: "desc" }
    });
  }

  async getBySlug(slugOrId: string) {
    const startup = await prisma.startup.findFirst({
      where: {
        OR: [
          { slug: slugOrId },
          { id: slugOrId }
        ]
      },
      include: {
        founders: { include: { profile: true } },
        jobs: { where: { isActive: true } }
      }
    });
    if (!startup) throw new AppError(404, "Startup not found");
    return startup;
  }

  async createStartup(data: any) {
    // Create the startup and its OWNER membership atomically so a startup can
    // never exist without an owner. The owner is the founder the startup is
    // created for (data.founderId), which the controller resolves to req.user.id
    // for self-serve creation.
    return await prisma.$transaction(async (tx) => {
      const startup = await tx.startup.create({
        data: {
          ...data,
          isVerified: true,
          founders: { connect: [{ id: data.founderId }] }
        }
      });

      await createStartupOwnership(tx, {
        startupId: startup.id,
        userId: data.founderId,
      });

      return startup;
    });
  }

  async updateStartup(id: string, requesterId: string, role: string, data: any) {
    const startup = await prisma.startup.findUnique({
      where: { id },
      include: { 
        founders: true,
        members: { where: { userId: requesterId, status: "ACTIVE" } }
      }
    });

    if (!startup) throw new AppError(404, "Startup not found");

    const isMember = startup.members && startup.members.some(m => ['OWNER', 'ADMIN'].includes(m.role));
    const isLegacyFounder = startup.founders.some(f => f.id === requesterId);

    if (role !== "ADMIN" && !isMember && !isLegacyFounder) {
      throw new AppError(403, "Not authorized to update this startup");
    }

    return await prisma.startup.update({
      where: { id },
      data
    });
  }

  async deleteStartup(id: string) {
    return await prisma.startup.delete({ where: { id } });
  }

  async uploadImage(id: string, requesterId: string, role: string, type: "logo" | "banner", fileBuffer: Buffer, mimetype: string) {
    const startup = await prisma.startup.findUnique({ 
      where: { id }, 
      include: { 
        founders: true,
        members: { where: { userId: requesterId, status: "ACTIVE" } }
      } 
    });
    if (!startup) throw new AppError(404, "Startup not found");
    
    const isMember = startup.members && startup.members.some(m => ['OWNER', 'ADMIN'].includes(m.role));
    const isLegacyFounder = startup.founders.some(f => f.id === requesterId);

    if (role !== "ADMIN" && !isMember && !isLegacyFounder) {
      throw new AppError(403, "Not authorized");
    }

    const bucket = type === "logo" ? env.STORAGE_BUCKET_LOGOS : env.STORAGE_BUCKET_BANNERS;
    const path = `${id}/${type}-${Date.now()}`;
    const url = await uploadFile(bucket, path, fileBuffer, mimetype);

    return await prisma.startup.update({
      where: { id },
      data: type === "logo" ? { logoUrl: url } : { bannerUrl: url }
    });
  }

  async getJobs(id: string) {
    return await prisma.job.findMany({ where: { startupId: id, isActive: true } });
  }

  async getDocuments(id: string, requesterId: string, role: string) {
    const startup = await prisma.startup.findUnique({ 
      where: { id }, 
      include: { 
        founders: true,
        members: { where: { userId: requesterId, status: "ACTIVE" } }
      } 
    });
    if (!startup) throw new AppError(404, "Startup not found");
    
    const isMember = startup.members && startup.members.some(m => ['OWNER', 'ADMIN', 'MEMBER'].includes(m.role));
    const isLegacyFounder = startup.founders.some(f => f.id === requesterId);

    if (role !== "ADMIN" && !isMember && !isLegacyFounder) {
      throw new AppError(403, "Not authorized");
    }

    return await prisma.document.findMany({ where: { startupId: id } });
  }

  async getJobApplications(startupId: string, userId: string, role: string) {
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      include: { 
        founders: true,
        members: { where: { userId, status: "ACTIVE" } }
      }
    });
    
    if (!startup) throw new AppError(404, "Startup not found");

    const isMember = startup.members && startup.members.some(m => ['OWNER', 'ADMIN'].includes(m.role));
    const isLegacyFounder = startup.founders.some(f => f.id === userId);

    if (role !== "ADMIN" && !isMember && !isLegacyFounder) {
      throw new AppError(403, "Not authorized to view applications for this startup");
    }

    return await prisma.jobApplication.findMany({
      where: { job: { startupId } },
      include: {
        job: { select: { id: true, title: true, type: true } },
        user: { select: { id: true, email: true, profile: true } }
      },
      orderBy: { appliedAt: 'desc' }
    });
  }
}
