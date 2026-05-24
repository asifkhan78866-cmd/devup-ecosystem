import { Request, Response } from "express";
import { ServicesService } from "./services.service";
import { logger } from "../../middleware/logger";

export class ServicesController {
  static async createRequest(req: Request, res: Response) {
    logger.info(`Creating service request for ${req.body.serviceName}`);
    const request = await ServicesService.createRequest(req.body);
    res.status(201).json({ success: true, data: request });
  }

  static async getAllRequests(req: Request, res: Response) {
    const requests = await ServicesService.getAllRequests();
    res.status(200).json({ success: true, data: requests });
  }

  static async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;
    logger.info(`Updating service request ${id} to ${status}`);
    
    const request = await ServicesService.updateStatus(id as string, status);
    res.status(200).json({ success: true, data: request });
  }
}
