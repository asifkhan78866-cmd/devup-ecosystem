import { Request, Response } from "express";
import { StartupsService } from "./startups.service";
import { uploadStartupImage } from "../../lib/storage";
import { verifyUpload } from "../../lib/uploads";

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

    // The owner is decided by the service from who is asking, not by the body.
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

    // Stored under the creator's id: the startup has no id yet, and the slug is
    // request input, so it never becomes part of a storage path.
    const folder = req.user!.id;
    payload.logoUrl = await uploadStartupImage(files.logo[0], folder, "logo");

    if (files.screenshots && files.screenshots.length > 0) {
      payload.screenshotUrls = await Promise.all(
        files.screenshots.map((f) => uploadStartupImage(f, folder, "screenshot"))
      );
    }

    const data = await startupsService.createStartup(payload, req.user!);
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

    // Authorise before storing anything, and file images under the startup's
    // own id rather than a slug from the body.
    const startup = await startupsService.assertCanManage(req.params.id as string, req.user!.id, req.user!.role);

    if (files?.logo?.[0]) {
      payload.logoUrl = await uploadStartupImage(files.logo[0], startup.id, "logo");
    }

    if (files?.screenshots && files.screenshots.length > 0) {
      payload.screenshotUrls = await Promise.all(
        files.screenshots.map((f) => uploadStartupImage(f, startup.id, "screenshot"))
      );
    }

    const data = await startupsService.updateStartup(req.params.id as string, req.user!.id, req.user!.role, payload);
    res.status(200).json({ success: true, data });
  }

  async deleteStartup(req: Request, res: Response) {
    await startupsService.deleteStartup(req.params.id as string);
    res.status(200).json({ success: true, message: "Startup deleted successfully" });
  }

  // SVG is no longer accepted: it can carry script, and these are public files.
  async uploadLogo(req: Request, res: Response) {
    const image = verifyUpload(req.file, "image");
    const data = await startupsService.uploadImage(req.params.id as string, req.user!.id, req.user!.role, "logo", image);
    res.status(200).json({ success: true, data });
  }

  async uploadBanner(req: Request, res: Response) {
    const image = verifyUpload(req.file, "image");
    const data = await startupsService.uploadImage(req.params.id as string, req.user!.id, req.user!.role, "banner", image);
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
