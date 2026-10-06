import { Request, Response, NextFunction } from "express";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { AppError } from "./errorHandler";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../config/supabase";

/**
 * Supabase Auth is the only judge of a bearer token.
 *
 * There used to be a second path that verified tokens locally against
 * SUPABASE_JWT_SECRET whenever Supabase said no. That made the shared secret a
 * master key — anyone holding it could mint a token for any user id, admins
 * included — and it kept accepting sessions Supabase had already revoked.
 * There is no fallback now: if Supabase does not vouch for the token, the
 * request is refused.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "Not authorized, no token", "MISSING_TOKEN");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      throw new AppError(401, "Not authorized, no token", "MISSING_TOKEN");
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      // An unreachable auth server is not a bad token. Answering 401 would sign
      // every user out during a blip; 503 still refuses the request.
      if (error && (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500)) {
        throw new AppError(503, "Authentication is temporarily unavailable. Please retry.", "AUTH_UNAVAILABLE");
      }
      throw new AppError(401, "Invalid or expired token", "INVALID_TOKEN");
    }

    const user = await prisma.user.findUnique({ where: { id: data.user.id } });
    if (!user) {
      throw new AppError(401, "Not authorized, user not found", "USER_NOT_FOUND");
    }

    req.user = user;
    next();
  } catch (error) {
    // Anything unexpected still refuses the request; the error handler decides
    // the status without ever echoing the token.
    next(error);
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
