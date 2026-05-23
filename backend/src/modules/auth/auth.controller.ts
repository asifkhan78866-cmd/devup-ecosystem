import { Request, Response } from "express";
import { AuthService } from "./auth.service";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, data: user });
  }

  async login(req: Request, res: Response) {
    const data = await authService.login(req.body);
    res.status(200).json({ success: true, data });
  }

  async logout(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] || "";
    await authService.logout(token);
    res.status(200).json({ success: true, message: "Logged out successfully" });
  }

  async getMe(req: Request, res: Response) {
    res.status(200).json({ success: true, data: (req as any).user });
  }
}
