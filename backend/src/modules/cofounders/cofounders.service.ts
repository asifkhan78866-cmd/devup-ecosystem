import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { resend, EmailTemplates } from "../../lib/resend";
import { env } from "../../config/env";

export class CofoundersService {
  async getProfiles(query: any) {
    const { page = 1, limit = 10, role, stage } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isActive: true };
    if (role) where.role = role;
    if (stage) where.stage = stage;

    const [data, total] = await Promise.all([
      prisma.cofounderProfile.findMany({
        where,
        skip,
        take: Number(limit),
        include: { user: { select: { id: true, profile: true } } },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.cofounderProfile.count({ where })
    ]);

    const pageNumber = Number(page);
    const pageLimit = Number(limit);
    const totalPages = Math.ceil(total / pageLimit);

    return { data, meta: { total, page: pageNumber, limit: pageLimit, totalPages } };
  }

  async getProfileByUserId(userId: string) {
    const profile = await prisma.cofounderProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, profile: true } } }
    });
    if (!profile) throw new AppError(404, "Co-founder profile not found");
    return profile;
  }

  async createProfile(userId: string, data: any) {
    const existing = await prisma.cofounderProfile.findUnique({ where: { userId } });
    if (existing) throw new AppError(400, "Profile already exists");

    const { fullName, collegeBackground, linkedinUrl, shortBio, city, ...cofounderData } = data;

    // Update user profile with the missing data
    if (fullName || collegeBackground || linkedinUrl || shortBio || city) {
        await prisma.profile.update({
            where: { userId },
            data: {
                ...(fullName && { name: fullName }),
                ...(collegeBackground && { college: collegeBackground }),
                ...(linkedinUrl && { linkedinUrl }),
                ...(shortBio && { bio: shortBio }),
                ...(city && { city })
            }
        })
    }

    return await prisma.cofounderProfile.create({
      data: { ...cofounderData, userId }
    });
  }

  async updateProfile(userId: string, data: any) {
    return await prisma.cofounderProfile.update({
      where: { userId },
      data
    });
  }

  async sendRequest(fromUserId: string, toUserId: string, message: string) {
    if (fromUserId === toUserId) throw new AppError(400, "Cannot send request to yourself");

    const toUser = await prisma.user.findUnique({ where: { id: toUserId }, include: { profile: true } });
    if (!toUser) throw new AppError(404, "User not found");

    const existing = await prisma.cofounderRequest.findUnique({
      where: { fromUserId_toUserId: { fromUserId, toUserId } }
    });

    if (existing) throw new AppError(400, "Request already sent");

    const request = await prisma.cofounderRequest.create({
      data: { fromUserId, toUserId, message }
    });

    const fromUser = await prisma.user.findUnique({ where: { id: fromUserId }, include: { profile: true } });

    if (toUser.email) {
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: toUser.email,
        subject: "New Co-founder Request - DevUp Ecosystem",
        html: EmailTemplates.cofounderRequest(fromUser?.profile?.name || "Someone", message)
      }).catch(err => console.error("Email error:", err));
    }

    return request;
  }

  async getRequests(userId: string) {
    const received = await prisma.cofounderRequest.findMany({
      where: { toUserId: userId },
      include: { fromUser: { select: { id: true, profile: true } } },
      orderBy: { createdAt: "desc" }
    });

    const sent = await prisma.cofounderRequest.findMany({
      where: { fromUserId: userId },
      include: { toUser: { select: { id: true, profile: true } } },
      orderBy: { createdAt: "desc" }
    });

    return { received, sent };
  }

  async updateRequestStatus(requestId: string, toUserId: string, status: "ACCEPTED" | "REJECTED") {
    const request = await prisma.cofounderRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new AppError(404, "Request not found");
    if (request.toUserId !== toUserId) throw new AppError(403, "Not authorized to update this request");

    return await prisma.cofounderRequest.update({
      where: { id: requestId },
      data: { status }
    });
  }
}
