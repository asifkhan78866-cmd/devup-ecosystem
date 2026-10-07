import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { uploadFile } from "../../lib/storage";
import { env } from "../../config/env";
import { Prisma } from "@prisma/client";
import { createStartupOwnership } from "./ownership.service";
import { canManageStartup, isAnyMember } from "../../lib/tenantRoles";

/**
 * The columns a startup's own team may write. Everything else in a request body
 * is dropped — above all nested relation writes: Prisma treats
 * `{ employees: { connect: [{ id }] } }` as "move that row into this startup",
 * so passing the body through let a founder of startup A pull startup B's
 * employees, jobs, members or documents into A by id.
 */
const TEAM_EDITABLE = [
  "name", "slug", "tagline", "description", "logoUrl", "screenshotUrls", "bannerUrl", "website",
  "domain", "stage", "foundedYear", "headcount", "location", "city", "fundingAmount", "mrr",
  "userCount", "founderNames", "githubUrl", "linkedinUrl", "twitterUrl", "aiAnalysis",
] as const;

/** Presentation and moderation flags only DevUp may set. */
const PLATFORM_EDITABLE = ["type", "isVerified", "isFeatured", "isActive"] as const;

const isPlatformAdmin = (role: string) => role === "ADMIN" || role === "SUPER_ADMIN";

function writableFields(data: Record<string, unknown> | undefined, role: string) {
  const allowed: readonly string[] = isPlatformAdmin(role)
    ? [...TEAM_EDITABLE, ...PLATFORM_EDITABLE]
    : TEAM_EDITABLE;
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (data && Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) out[key] = data[key];
  }
  return out;
}

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

  async createStartup(data: any, actor: { id: string; role: string }) {
    // Create the startup and its OWNER membership atomically so a startup can
    // never exist without an owner. Self-serve creation always makes the caller
    // the owner; only DevUp may create a startup on someone else's behalf.
    // Previously any founder could name an arbitrary user id as the owner.
    const founderId = isPlatformAdmin(actor.role) && data?.founderId ? String(data.founderId) : actor.id;

    return await prisma.$transaction(async (tx) => {
      const startup = await tx.startup.create({
        data: {
          ...(writableFields(data, actor.role) as any),
          founderId,
          isVerified: true,
          founders: { connect: [{ id: founderId }] }
        }
      });

      await createStartupOwnership(tx, {
        startupId: startup.id,
        userId: founderId,
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

    const isMember = canManageStartup(startup.members);
    const isLegacyFounder = startup.founders.some(f => f.id === requesterId);

    if (role !== "ADMIN" && !isMember && !isLegacyFounder) {
      throw new AppError(403, "Not authorized to update this startup");
    }

    // Only listed columns are written. Admins may additionally change how a
    // startup is presented (venture vs partner) and moderated; a founder must
    // not be able to label their own company an official partner or verify it.
    return await prisma.startup.update({
      where: { id },
      data: writableFields(data, role) as any,
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
    
    const isMember = canManageStartup(startup.members);
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
    
    const isMember = isAnyMember(startup.members);
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

    const isMember = canManageStartup(startup.members);
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
