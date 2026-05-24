import { Request, Response } from "express";
import { DocumentsService } from "./documents.service";
import { AppError } from "../../middleware/errorHandler";

const documentsService = new DocumentsService();

export class DocumentsController {
  async uploadDocument(req: Request, res: Response) {
    if (!req.file) throw new AppError(400, "No file uploaded");
    const data = await documentsService.uploadDocument(req.user!.id, req.body, req.file.buffer, req.file.mimetype);
    res.status(201).json({ success: true, data });
  }

  async getDocument(req: Request, res: Response) {
    const data = await documentsService.getDocument(req.params.id as string, req.user!.id, req.user!.role);
    res.status(200).json({ success: true, data });
  }

  async signDocument(req: Request, res: Response) {
    const data = await documentsService.signDocument(req.params.id as string, req.user!.id, req.user!.role);
    res.status(200).json({ success: true, data });
  }
}
