import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { prisma } from "../../lib/prisma";

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
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        // ACTIVE OWNER memberships give the dashboard the caller's own startup(s).
        startupMemberships: {
          where: { status: "ACTIVE" },
          include: { startup: { select: { id: true, slug: true, name: true } } },
        },
      },
    });
    res.status(200).json({ success: true, data: user });
  }
}
