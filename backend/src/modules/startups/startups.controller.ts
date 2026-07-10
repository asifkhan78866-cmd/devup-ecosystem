import { Request, Response } from "express";
import { StartupsService } from "./startups.service";
import { AppError } from "../../middleware/errorHandler";
import { env } from "../../config/env";
import { uploadStartupImage } from "../../lib/storage";

const startupsService = new StartupsService();

export class StartupsController {
  async getStartups(req: Request, res: Response) {
    const { data, meta } = await startupsService.getStartups(req.query);
    res.status(200).json({ success: true, data, meta });
  }

  async getFeatured(req: Request, res: Response) {
    const data = await startupsService.getFeatured();
    res.status(200).json({ success: true, data });
  }

  async getBySlug(req: Request, res: Response) {
    const data = await startupsService.getBySlug(req.params.slug as string);
    res.status(200).json({ success: true, data });
  }

  async createStartup(req: Request, res: Response) {
    const files = req.files as {
      logo?: Express.Multer.File[];
      screenshots?: Express.Multer.File[];
    };

    if (!files?.logo?.[0]) {
      return res.status(400).json({
        success: false,
        error: "A startup logo is required",
        code: "LOGO_REQUIRED",
      });
    }

    const payload = { ...req.body };
    if (!payload.founderId) {
      payload.founderId = req.user!.id;
    }

    if (payload.foundedYear) payload.foundedYear = parseInt(payload.foundedYear, 10);
    if (payload.fundingAmount) payload.fundingAmount = parseFloat(payload.fundingAmount);
    if (payload.userCount) payload.userCount = parseInt(payload.userCount, 10);
    if (payload.aiAnalysis && typeof payload.aiAnalysis === 'string') {
      try { payload.aiAnalysis = JSON.parse(payload.aiAnalysis); } catch (e) {}
    }
    if (payload.founderNames && typeof payload.founderNames === 'string') {
      try { payload.founderNames = JSON.parse(payload.founderNames); } catch (e) {}
    }

    const slug = payload.slug;
    payload.logoUrl = await uploadStartupImage(files.logo[0], slug, "logo");

    if (files.screenshots && files.screenshots.length > 0) {
      payload.screenshotUrls = await Promise.all(
        files.screenshots.map((f) => uploadStartupImage(f, slug, "screenshot"))
      );
    }

    const data = await startupsService.createStartup(payload);
    res.status(201).json({ success: true, data });
  }

  async updateStartup(req: Request, res: Response) {
    const files = req.files as {
      logo?: Express.Multer.File[];
      screenshots?: Express.Multer.File[];
    };
    
    const payload = { ...req.body };
    if (payload.foundedYear) payload.foundedYear = parseInt(payload.foundedYear, 10);
    if (payload.fundingAmount) payload.fundingAmount = parseFloat(payload.fundingAmount);
    if (payload.userCount) payload.userCount = parseInt(payload.userCount, 10);
    if (payload.aiAnalysis && typeof payload.aiAnalysis === 'string') {
      try { payload.aiAnalysis = JSON.parse(payload.aiAnalysis); } catch (e) {}
    }
    if (payload.founderNames && typeof payload.founderNames === 'string') {
      try { payload.founderNames = JSON.parse(payload.founderNames); } catch (e) {}
    }

    const slug = payload.slug || req.params.id; // use ID if slug not in body

    if (files?.logo?.[0]) {
      payload.logoUrl = await uploadStartupImage(files.logo[0], slug, "logo");
    }

    if (files?.screenshots && files.screenshots.length > 0) {
      payload.screenshotUrls = await Promise.all(
        files.screenshots.map((f) => uploadStartupImage(f, slug, "screenshot"))
      );
    }

    const data = await startupsService.updateStartup(req.params.id as string, req.user!.id, req.user!.role, payload);
    res.status(200).json({ success: true, data });
  }

  async deleteStartup(req: Request, res: Response) {
    await startupsService.deleteStartup(req.params.id as string);
    res.status(200).json({ success: true, message: "Startup deleted successfully" });
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
    const data = await startupsService.uploadImage(req.params.id as string, req.user!.id, req.user!.role, "logo", req.file.buffer, req.file.mimetype);
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
    const data = await startupsService.uploadImage(req.params.id as string, req.user!.id, req.user!.role, "banner", req.file.buffer, req.file.mimetype);
    res.status(200).json({ success: true, data });
  }

  async getJobs(req: Request, res: Response) {
    const data = await startupsService.getJobs(req.params.id as string);
    res.status(200).json({ success: true, data });
  }

  async getDocuments(req: Request, res: Response) {
    const data = await startupsService.getDocuments(req.params.id as string, req.user!.id, req.user!.role);
    res.status(200).json({ success: true, data });
  }

  async getJobApplications(req: Request, res: Response) {
    const data = await startupsService.getJobApplications(req.params.id as string, req.user!.id, req.user!.role);
    res.status(200).json({ success: true, data });
  }
}
