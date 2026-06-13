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

  async getHackathon(req: Request, res: Response) {
    const data = await hackathonsService.getHackathon(req.params.id as string);
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
    if (!req.file) throw new AppError(400, "No file uploaded");
    const maxBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (req.file.size > maxBytes) {
      throw new AppError(400, "File exceeds maximum size", "FILE_TOO_LARGE");
    }
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError(400, "Invalid file type", "INVALID_FILE_TYPE");
    }
    const data = await hackathonsService.uploadImage(req.params.id as string, "logo", req.file.buffer, req.file.mimetype);
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
}
