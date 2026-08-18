import { Request, Response } from "express";
import { LeadApplicationsService } from "./lead-applications.service";
import { LeadershipRole, LeadershipAppStatus } from "@prisma/client";

const service = new LeadApplicationsService();

export class LeadApplicationsController {
  async submitApplication(req: Request, res: Response) {
    const {
      role,
      fullName,
      email,
      phone,
      state,
      city,
      college,
      branch,
      yearOfStudy,
      linkedinUrl,
      githubUrl,
      twitterUrl,
      portfolioUrl,
      whyLead,
      pastExperience,
      first30DaysPlan,
    } = req.body;

    if (!role || !fullName || !email || !phone || !state || !city || !college || !whyLead) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: role, fullName, email, phone, state, city, college, whyLead are required.",
      });
    }

    const application = await service.createApplication({
      role: role as LeadershipRole,
      fullName,
      email,
      phone,
      state,
      city,
      college,
      branch,
      yearOfStudy,
      linkedinUrl,
      githubUrl,
      twitterUrl,
      portfolioUrl,
      whyLead,
      pastExperience,
      first30DaysPlan,
    });

    return res.status(201).json({
      success: true,
      data: application,
      message: "Your application to Lead DevUp has been submitted successfully!",
    });
  }

  async getApplications(req: Request, res: Response) {
    const { role, status, search } = req.query;
    const applications = await service.getApplications({
      role: role ? (role as LeadershipRole) : undefined,
      status: status ? (status as LeadershipAppStatus) : undefined,
      search: search ? String(search) : undefined,
    });

    return res.status(200).json({
      success: true,
      data: applications,
    });
  }

  async getApplicationById(req: Request, res: Response) {
    const { id } = req.params;
    const application = await service.getApplicationById(id);
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }
    return res.status(200).json({ success: true, data: application });
  }

  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;
    const reviewerId = (req as any).user?.id;

    if (!status) {
      return res.status(400).json({ success: false, error: "Status is required" });
    }

    const updated = await service.updateStatus(id, status as LeadershipAppStatus, reviewNotes, reviewerId);
    return res.status(200).json({ success: true, data: updated });
  }
}
