import { Request, Response } from "express";
import { StartupsService } from "./startups.service";
import { AppError } from "../../middleware/errorHandler";

const startupsService = new StartupsService();

export class StartupsController {
  async getStartups(req: Request, res: Response) {
    const data = await startupsService.getStartups(req.query);
    res.status(200).json({ success: true, ...data });
  }

  async getFeatured(req: Request, res: Response) {
    const data = await startupsService.getFeatured();
    res.status(200).json({ success: true, data });
  }

  async getBySlug(req: Request, res: Response) {
    const data = await startupsService.getBySlug(req.params.slug);
    res.status(200).json({ success: true, data });
  }

  async createStartup(req: Request, res: Response) {
    const data = await startupsService.createStartup(req.body);
    res.status(201).json({ success: true, data });
  }

  async updateStartup(req: Request, res: Response) {
    const data = await startupsService.updateStartup(req.params.id, req.user!.id, req.user!.role, req.body);
    res.status(200).json({ success: true, data });
  }

  async deleteStartup(req: Request, res: Response) {
    await startupsService.deleteStartup(req.params.id);
    res.status(200).json({ success: true, message: "Startup deleted successfully" });
  }

  async uploadLogo(req: Request, res: Response) {
    if (!req.file) throw new AppError(400, "No file uploaded");
    const data = await startupsService.uploadImage(req.params.id, req.user!.id, req.user!.role, "logo", req.file.buffer, req.file.mimetype);
    res.status(200).json({ success: true, data });
  }

  async uploadBanner(req: Request, res: Response) {
    if (!req.file) throw new AppError(400, "No file uploaded");
    const data = await startupsService.uploadImage(req.params.id, req.user!.id, req.user!.role, "banner", req.file.buffer, req.file.mimetype);
    res.status(200).json({ success: true, data });
  }

  async getJobs(req: Request, res: Response) {
    const data = await startupsService.getJobs(req.params.id);
    res.status(200).json({ success: true, data });
  }

  async getDocuments(req: Request, res: Response) {
    const data = await startupsService.getDocuments(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json({ success: true, data });
  }
}
