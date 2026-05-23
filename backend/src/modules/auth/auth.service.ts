import { prisma } from "../../lib/prisma";
import { supabaseAdmin } from "../../config/supabase";
import { AppError } from "../../middleware/errorHandler";
import { Role } from "@prisma/client";
import { env } from "../../config/env";
import jwt from "jsonwebtoken";

export class AuthService {
  async register(data: any) {
    const { email, password, role, adminSecret } = data;

    // Validate admin secret
    let finalRole = role;
    if (adminSecret) {
      if (adminSecret !== env.ADMIN_SECRET_KEY) {
        throw new AppError(403, "Invalid admin secret key");
      }
      finalRole = Role.ADMIN;
    }

    // Check if user exists in DB
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(400, "User already exists");
    }

    // Register with Supabase Auth
    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !authData.user) {
      throw new AppError(500, error?.message || "Failed to create user in Supabase");
    }

    // Create user in Prisma
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        role: finalRole,
      },
    });

    return user;
  }

  async login(data: any) {
    const { email, password } = data;

    // DEV BYPASS: Allow dummy admin login locally without real Supabase instance
    if (email === "admin@devup.in" && password === "admin123") {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const token = jwt.sign({ sub: user.id }, env.SUPABASE_JWT_SECRET, { expiresIn: "1d" });
        return { user, token };
      }
    }

    const { data: authData, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !authData.session) {
      throw new AppError(401, "Invalid credentials");
    }

    const user = await prisma.user.findUnique({ where: { id: authData.user.id } });
    if (!user) {
      throw new AppError(404, "User record not found");
    }

    return {
      user,
      token: authData.session.access_token,
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
