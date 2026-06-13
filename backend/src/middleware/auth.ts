import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "Not authorized, no token", "MISSING_TOKEN");
    }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    
    // Fetch user from our DB
    if (!decoded?.sub) {
      throw new AppError(401, "Invalid token", "INVALID_TOKEN");
    }

  const userId = String(decoded.sub);
  const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new AppError(401, "Not authorized, user not found", "USER_NOT_FOUND");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, "Token expired", "TOKEN_EXPIRED"));
    }
    return next(new AppError(401, "Invalid token", "INVALID_TOKEN"));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "Not authorized", "UNAUTHORIZED"));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Forbidden, insufficient permissions", "FORBIDDEN"));
    }
    
    next();
  };
};
