import { Request, Response } from "express";
import { AiService } from "./ai.service";

const aiService = new AiService();

export class AiController {
  async reviewApplication(req: Request, res: Response) {
    const data = await aiService.reviewApplication(req.body.applicationId);
    res.status(200).json({ success: true, data });
  }

  async matchCofounders(req: Request, res: Response) {
    const data = await aiService.matchCofounders(req.body.profileId);
    res.status(200).json({ success: true, data });
  }

  async generateBio(req: Request, res: Response) {
    const data = await aiService.generateBio(req.body.startupDetails);
    res.status(200).json({ success: true, data });
  }
}
