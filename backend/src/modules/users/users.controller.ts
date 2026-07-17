import { Request, Response } from "express";
import { UsersService } from "./users.service";
import { AppError } from "../../middleware/errorHandler";

const usersService = new UsersService();

export class UsersController {
  async getUser(req: Request, res: Response) {
    const user = await usersService.getUserById(req.params.id as string);
    res.status(200).json({ success: true, data: user });
  }

  async getUsers(req: Request, res: Response) {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const users = await usersService.getAllUsers(limit);
    res.status(200).json({ success: true, data: users });
  }

  async updateUser(req: Request, res: Response) {
    const profile = await usersService.updateUser(req.params.id as string, (req as any).user!.id, req.body);
    res.status(200).json({ success: true, data: profile });
  }

  async uploadResume(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError(400, "No file uploaded");
    }
    const profile = await usersService.uploadResume(req.params.id as string, (req as any).user!.id, req.file.buffer, req.file.mimetype);
    res.status(200).json({ success: true, data: profile });
  }

  async getApplications(req: Request, res: Response) {
    const applications = await usersService.getUserApplications(req.params.id as string, (req as any).user!.id);
    res.status(200).json({ success: true, data: applications });
  }

  async getNotifications(req: Request, res: Response) {
    const notifications = await usersService.getUserNotifications(req.params.id as string, (req as any).user!.id);
    res.status(200).json({ success: true, data: notifications });
  }

  async getActivity(req: Request, res: Response) {
    const activity = await usersService.getUserActivity(req.params.id as string);
    res.status(200).json({ success: true, data: activity });
  }

  async deleteUser(req: Request, res: Response) {
    const result = await usersService.deleteUser(req.params.id as string, (req as any).user!.id);
    res.status(200).json(result);
  }
}
