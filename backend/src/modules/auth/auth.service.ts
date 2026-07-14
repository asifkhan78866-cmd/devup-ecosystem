import { prisma } from "../../lib/prisma";
import { supabaseAdmin } from "../../config/supabase";
import { AppError } from "../../middleware/errorHandler";
import { Role, AuthProvider } from "@prisma/client";
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
        authProvider: AuthProvider.EMAIL,
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
    if (process.env.NODE_ENV === "development" && email === "admin@devup.in" && password === "admin123") {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const token = jwt.sign(
          { sub: user.id },
          env.SUPABASE_JWT_SECRET as jwt.Secret,
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

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { sub: user.id },
      env.SUPABASE_JWT_SECRET as jwt.Secret,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
    );
    return {
      user,
      token,
    };
  }

  /**
   * Sync a Google OAuth user from Supabase Auth into the Prisma database.
   * Called after the frontend callback receives a valid session.
   * Idempotent: creates on first login, updates on subsequent logins.
   */
  async syncGoogleUser(accessToken: string) {
    // Verify the token with Supabase
    const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !authUser) {
      throw new AppError(401, "Invalid or expired token", "INVALID_TOKEN");
    }

    const email = authUser.email;
    if (!email) {
      throw new AppError(400, "No email found in Google account", "NO_EMAIL");
    }

    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split("@")[0];
    const avatarUrl =
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      null;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (existing) {
      // Update avatar, name, last login
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          avatarUrl: avatarUrl || existing.avatarUrl,
          authProvider: AuthProvider.GOOGLE,
          lastLoginAt: new Date(),
          profile: existing.profile
            ? {
                update: {
                  name: fullName || existing.profile.name,
                },
              }
            : {
                create: {
                  name: fullName,
                },
              },
        },
        include: { profile: true },
      });
      return updated;
    }

    // Create new user — Supabase auth ID as Prisma ID
    const newUser = await prisma.user.create({
      data: {
        id: authUser.id,
        email,
        role: Role.STUDENT, // default role
        isVerified: true,
        avatarUrl,
        authProvider: AuthProvider.GOOGLE,
        lastLoginAt: new Date(),
        profile: {
          create: {
            name: fullName,
          },
        },
      },
      include: { profile: true },
    });

    return newUser;
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
