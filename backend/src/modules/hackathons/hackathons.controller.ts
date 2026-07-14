import { Request, Response } from "express";
import { HackathonsService } from "./hackathons.service";
import { AppError } from "../../middleware/errorHandler";
import { env } from "../../config/env";

const hackathonsService = new HackathonsService();

export class HackathonsController {
  async getHackathons(req: Request, res: Response) {
    const { data, meta } = await hackathonsService.getHackathons(req.query);
    res.status(200).json({ success: true, data, meta });
  }

  async getFeatured(req: Request, res: Response) {
    const data = await hackathonsService.getFeaturedHackathon();
    res.status(200).json({ success: true, data });
  }

  async getById(req: Request, res: Response) {
    const data = await hackathonsService.getHackathon(req.params.id);
    res.status(200).json({ success: true, data });
  }

  async createHackathon(req: Request, res: Response) {
    const data = await hackathonsService.createHackathon(req.body);
    res.status(201).json({ success: true, data });
  }

  async updateHackathon(req: Request, res: Response) {
    const data = await hackathonsService.updateHackathon(req.params.id as string, req.body);
    res.status(200).json({ success: true, data });
  }

  async deleteHackathon(req: Request, res: Response) {
    await hackathonsService.deleteHackathon(req.params.id as string);
    res.status(200).json({ success: true, message: "Hackathon deleted successfully" });
  }

  async uploadLogo(req: Request, res: Response) {
    if (!req.file) throw new AppError(400, "No file provided");
    const data = await hackathonsService.uploadImage(req.params.id, "logo", req.file.buffer, req.file.mimetype);
    res.status(200).json({ success: true, data });
  }

  async createPartner(req: Request, res: Response) {
    const data = await hackathonsService.createPartner(req.params.id, req.body);
    res.status(201).json({ success: true, data });
  }

  async updatePartner(req: Request, res: Response) {
    const data = await hackathonsService.updatePartner(req.params.id, req.params.pid, req.body);
    res.status(200).json({ success: true, data });
  }

  async deletePartner(req: Request, res: Response) {
    await hackathonsService.deletePartner(req.params.id, req.params.pid);
    res.status(200).json({ success: true, message: "Partner deleted" });
  }

  async uploadPartnerLogo(req: Request, res: Response) {
    if (!req.file) throw new AppError(400, "No file provided");
    const data = await hackathonsService.uploadPartnerLogo(req.params.id, req.params.pid, req.file.buffer, req.file.mimetype);
    res.status(200).json({ success: true, data });
  }

  async uploadBanner(req: Request, res: Response) {
    if (!req.file) throw new AppError(400, "No file uploaded");
    const maxBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (req.file.size > maxBytes) {
      throw new AppError(400, "File exceeds maximum size", "FILE_TOO_LARGE");
    }
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError(400, "Invalid file type", "INVALID_FILE_TYPE");
    }
    const data = await hackathonsService.uploadImage(req.params.id as string, "banner", req.file.buffer, req.file.mimetype);
    res.status(200).json({ success: true, data });
  }

  async register(req: Request, res: Response) {
    const data = await hackathonsService.register(req.params.id as string, req.user!.id, req.body);
    res.status(201).json({ success: true, data });
  }

  async createLead(req: Request, res: Response) {
    const data = await hackathonsService.createLead(req.params.id as string, req.body);
    res.status(201).json({ success: true, data: { registrationId: data.id } });
  }

  async markLeadRedirected(req: Request, res: Response) {
    const data = await hackathonsService.markLeadRedirected(req.params.leadId);
    res.status(200).json({ success: true, data });
  }

  async getLeads(req: Request, res: Response) {
    const { data, meta } = await hackathonsService.getLeads(req.params.id as string);
    res.status(200).json({ success: true, data, meta });
  }

  async uploadSubmission(req: Request, res: Response) {
    if (!req.file) throw new AppError(400, "No file uploaded");
    
    if (req.file.size > 10 * 1024 * 1024) {
      throw new AppError(400, "File size must be less than 10MB");
    }
    
    const submission = await hackathonsService.uploadSubmission(req.params.id as string, req.params.leadId as string, req.file.buffer, req.file.mimetype);
    res.status(201).json({ success: true, data: submission });
  }

  async getSubmissionStatus(req: Request, res: Response) {
    const status = await hackathonsService.getSubmissionStatusByPhone(req.params.id as string, req.query.phone as string);
    res.status(200).json({ success: true, data: status });
  }

  async getAllSubmissions(req: Request, res: Response) {
    const { data, meta } = await hackathonsService.getAllSubmissions(req.params.id as string);
    res.status(200).json({ success: true, data, meta });
  }

  async updateSubmissionStatus(req: Request, res: Response) {
    const submission = await hackathonsService.updateSubmissionStatus(req.params.id as string, req.params.submissionId as string, req.body.status);
    res.status(200).json({ success: true, data: submission });
  }
}
