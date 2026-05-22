import { Request, Response } from "express";
import { CofoundersService } from "./cofounders.service";

const cofoundersService = new CofoundersService();

export class CofoundersController {
  async getProfiles(req: Request, res: Response) {
    const data = await cofoundersService.getProfiles(req.query);
    res.status(200).json({ success: true, ...data });
  }

  async getProfile(req: Request, res: Response) {
    const data = await cofoundersService.getProfileByUserId(req.params.id);
    res.status(200).json({ success: true, data });
  }

  async createProfile(req: Request, res: Response) {
    const data = await cofoundersService.createProfile(req.user!.id, req.body);
    res.status(201).json({ success: true, data });
  }

  async updateProfile(req: Request, res: Response) {
    const data = await cofoundersService.updateProfile(req.user!.id, req.body);
    res.status(200).json({ success: true, data });
  }

  async sendRequest(req: Request, res: Response) {
    const data = await cofoundersService.sendRequest(req.user!.id, req.params.id, req.body.message);
    res.status(201).json({ success: true, data });
  }

  async getRequests(req: Request, res: Response) {
    const data = await cofoundersService.getRequests(req.user!.id);
    res.status(200).json({ success: true, data });
  }

  async updateRequestStatus(req: Request, res: Response) {
    const data = await cofoundersService.updateRequestStatus(req.params.id, req.user!.id, req.body.status);
    res.status(200).json({ success: true, data });
  }
}
