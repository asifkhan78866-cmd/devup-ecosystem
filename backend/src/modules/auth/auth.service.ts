import { isAuthRetryableFetchError, Session } from "@supabase/supabase-js";
import { prisma } from "../../lib/prisma";
import { supabaseAdmin, createSessionClient } from "../../config/supabase";
import { AppError } from "../../middleware/errorHandler";
import { Role, AuthProvider } from "@prisma/client";
import { env, productionGaps } from "../../config/env";
import { claimByEmail } from "../shared/claim.service";

/** The parts of a Supabase session an API client needs, and nothing else. */
function sessionTokens(session: Session) {
  return {
    token: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
  };
}

export class AuthService {
  async register(data: any) {
    const { email, password, role, adminSecret, name, college, city } = data;

    // Validate admin secret
    let finalRole = role;
    if (adminSecret) {
      // Closed entirely rather than falling back to the default in this repo.
      if (productionGaps.adminRegistrationDisabled) {
        throw new AppError(
          503,
          "Admin registration is disabled on this deployment",
          "ADMIN_REGISTRATION_DISABLED"
        );
      }
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

    // Attach anything HR created for this email before they signed up.
    await claimByEmail(user.id, email);

    return user;
  }

  /**
   * Password sign-in for clients that talk only to this API (the admin portal).
   *
   * Returns Supabase's own session rather than a token minted here. Minting
   * locally meant signing with the project's JWT secret, which made that secret
   * a skeleton key; Supabase's session can be refreshed and revoked, ours could
   * not. There is deliberately no hardcoded development login any more.
   */
  async login(data: any) {
    const { email, password } = data;

    const { data: authData, error } = await createSessionClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error || !authData.session) {
      if (error && isAuthRetryableFetchError(error)) {
        throw new AppError(503, "Authentication is temporarily unavailable. Please retry.", "AUTH_UNAVAILABLE");
      }
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

    return {
      user,
      ...sessionTokens(authData.session),
    };
  }

  /**
   * Trades a refresh token for a new session. Supabase access tokens are
   * short-lived, so API-only clients call this instead of signing in again.
   */
  async refresh(refreshToken: string) {
    const { data, error } = await createSessionClient().auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      if (error && isAuthRetryableFetchError(error)) {
        throw new AppError(503, "Authentication is temporarily unavailable. Please retry.", "AUTH_UNAVAILABLE");
      }
      throw new AppError(401, "Session expired. Please sign in again.", "INVALID_REFRESH_TOKEN");
    }

    return sessionTokens(data.session);
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

    // They may have been onboarded by email before this account existed.
    await claimByEmail(newUser.id, email);

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
