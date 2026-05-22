import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "Not authorized, no token");
    }

    const token = authHeader.split(" ")[1];
    
    // Verify Supabase JWT
    const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET) as { sub: string };
    
    // Fetch user from our DB
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    
    if (!user) {
      throw new AppError(401, "Not authorized, user not found");
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError(401, "Not authorized, token failed"));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "Not authorized"));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Forbidden, insufficient permissions"));
    }
    
    next();
  };
};
