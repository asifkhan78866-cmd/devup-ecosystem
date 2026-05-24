import { Request, Response } from "express";
import { ApplicationsService } from "./applications.service";
import { AppError } from "../../middleware/errorHandler";

const applicationsService = new ApplicationsService();

export class ApplicationsController {
  async submitApplication(req: Request, res: Response) {
    const application = await applicationsService.submitApplication(req.user!.id, req.body);
    res.status(201).json({ success: true, data: application });
  }

  async uploadPitchDeck(req: Request, res: Response) {
    if (!req.file) throw new AppError(400, "No pitch deck uploaded");
    const data = await applicationsService.uploadPitchDeck(req.params.id as string, req.user!.id, req.file.buffer, req.file.mimetype);
    res.status(200).json({ success: true, data });
  }

  async getApplications(req: Request, res: Response) {
    const data = await applicationsService.getApplications(req.query);
    res.status(200).json({ success: true, ...data });
  }

  async getApplication(req: Request, res: Response) {
    const data = await applicationsService.getApplication(req.params.id as string, req.user!.id, req.user!.role);
    res.status(200).json({ success: true, data });
  }

  async reviewApplication(req: Request, res: Response) {
    const data = await applicationsService.reviewApplication(req.params.id as string, req.user!.id, req.body);
    res.status(200).json({ success: true, data });
  }
}
