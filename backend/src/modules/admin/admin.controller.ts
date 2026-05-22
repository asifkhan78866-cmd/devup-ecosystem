import { Request, Response } from "express";
import { AdminService } from "./admin.service";

const adminService = new AdminService();

export class AdminController {
  async getStats(req: Request, res: Response) {
    const data = await adminService.getStats();
    res.status(200).json({ success: true, data });
  }

  async getAuditLogs(req: Request, res: Response) {
    const data = await adminService.getAuditLogs(req.query);
    res.status(200).json({ success: true, ...data });
  }
}
