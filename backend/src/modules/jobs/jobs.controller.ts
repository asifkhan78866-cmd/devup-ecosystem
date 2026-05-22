import { Request, Response } from "express";
import { JobsService } from "./jobs.service";

const jobsService = new JobsService();

export class JobsController {
  async getJobs(req: Request, res: Response) {
    const data = await jobsService.getJobs(req.query);
    res.status(200).json({ success: true, ...data });
  }

  async getJob(req: Request, res: Response) {
    const data = await jobsService.getJob(req.params.id);
    res.status(200).json({ success: true, data });
  }

  async createJob(req: Request, res: Response) {
    const data = await jobsService.createJob(req.user!.id, req.user!.role, req.body);
    res.status(201).json({ success: true, data });
  }

  async updateJob(req: Request, res: Response) {
    const data = await jobsService.updateJob(req.params.id, req.user!.id, req.user!.role, req.body);
    res.status(200).json({ success: true, data });
  }

  async deleteJob(req: Request, res: Response) {
    await jobsService.deleteJob(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json({ success: true, message: "Job deleted successfully" });
  }

  async applyForJob(req: Request, res: Response) {
    const data = await jobsService.applyForJob(req.params.id, req.user!.id, req.body);
    res.status(201).json({ success: true, data });
  }
}
