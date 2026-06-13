import { prisma } from "../../lib/prisma";
import { supabaseAdmin } from "../../config/supabase";
import { AppError } from "../../middleware/errorHandler";
import { Role } from "@prisma/client";
import { env } from "../../config/env";
import jwt from "jsonwebtoken";

export class AuthService {
  async register(data: any) {
    const { email, password, role, adminSecret, name, college, city } = data;

    // Validate admin secret
    let finalRole = role;
    if (adminSecret) {
      if (adminSecret !== env.ADMIN_REGISTRATION_SECRET) {
        throw new AppError(403, "Invalid admin secret key", "INVALID_ADMIN_SECRET");
      }
      finalRole = Role.ADMIN;
    }

    // Check if user exists in DB
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(400, "User already exists", "USER_EXISTS");
    }

    // Register with Supabase Auth
    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !authData.user) {
      throw new AppError(500, error?.message || "Failed to create user in Supabase", "SUPABASE_CREATE_FAILED");
    }

    // Create user in Prisma
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        role: finalRole,
        profile: {
          create: {
            name: name || email.split('@')[0],
            college: college || null,
            city: city || null,
          }
        }
      },
      include: {
        profile: true
      }
    });

    return user;
  }

  async login(data: any) {
    const { email, password } = data;

    // DEV BYPASS: Allow dummy admin login locally without real Supabase instance
    if (email === "admin@devup.in" && password === "admin123") {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const token = jwt.sign(
          { sub: user.id },
          env.JWT_SECRET as jwt.Secret,
          { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
        );
        return { user, token };
      }
    }

    const { data: authData, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !authData.session) {
      throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    }

    const user = await prisma.user.findUnique({ where: { id: authData.user.id } });
    if (!user) {
      throw new AppError(404, "User record not found", "USER_NOT_FOUND");
    }

    const token = jwt.sign(
      { sub: user.id },
      env.JWT_SECRET as jwt.Secret,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
    );
    return {
      user,
      token,
    };
  }

  async logout(token: string) {
    // Supabase handles logout usually on client side by discarding token
    // We can also invalidate it via admin API if needed
    const { error } = await supabaseAdmin.auth.admin.signOut(token);
    if (error) {
      console.error("Signout error:", error);
    }
    return { success: true };
  }
}
