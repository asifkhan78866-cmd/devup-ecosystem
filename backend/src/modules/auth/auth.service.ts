import { randomBytes } from "crypto";
import { isAuthRetryableFetchError, Session } from "@supabase/supabase-js";
import { prisma } from "../../lib/prisma";
import { supabaseAdmin, createSessionClient } from "../../config/supabase";
import { AppError } from "../../middleware/errorHandler";
import { Role, AuthProvider } from "@prisma/client";
import { env, productionGaps } from "../../config/env";
import { claimByEmail } from "../shared/claim.service";
import { logger } from "../../middleware/logger";
import {
  issueVerification,
  sendAccountExistsNotice,
  verifyEmail,
  resendVerification,
  assertVerificationMailConfigured,
} from "./verification.service";

/** The parts of a Supabase session an API client needs, and nothing else. */
function sessionTokens(session: Session) {
  return {
    token: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
  };
}

/**
 * What every signup attempt hears back, whether the address was new, already
 * registered, or already verified. Anything more specific tells a stranger
 * which addresses have accounts.
 */
const SIGNUP_ACCEPTED = {
  verificationRequired: true,
  message: "Check your inbox for a link to confirm your email address.",
};

export class AuthService {
  /**
   * Public signup. Creates an account that is *not* yet trusted with its email:
   * Supabase holds it unconfirmed (so it cannot sign in) and nothing keyed by
   * the address is attached to it until the owner of the inbox follows the
   * verification link. Previously the address was confirmed on the spot and
   * the account immediately inherited every record HR had created for it.
   */
  async register(data: any) {
    const { password, role, adminSecret, name, college, city } = data;
    const email = String(data.email ?? "").trim().toLowerCase();
    assertVerificationMailConfigured();

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

    // An address that already has an account gets the same answer as a new
    // one. Its owner hears about it by email instead: a fresh link if it was
    // never verified, a "you already have an account" note if it was.
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    if (existing) {
      if (existing.emailVerifiedAt) await sendAccountExistsNotice(existing.email);
      else await issueVerification(existing.id, existing.email);
      return SIGNUP_ACCEPTED;
    }

    // Unconfirmed on purpose: Supabase refuses password sign-in until the
    // verification link confirms it.
    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (error || !authData.user) {
      if (error && (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500)) {
        throw new AppError(503, "Signup is temporarily unavailable. Please retry.", "AUTH_UNAVAILABLE");
      }
      if (error?.code === "weak_password") {
        throw new AppError(400, error.message, "WEAK_PASSWORD");
      }
      // Most likely an auth account with no profile row behind it. Same answer
      // as any other existing address.
      logger.warn(`signup: auth account not created (${error?.code ?? error?.status ?? "unknown"})`);
      return SIGNUP_ACCEPTED;
    }

    // Create user in Prisma
    await prisma.user.create({
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
    });

    // Nothing is claimed here. Records created for this address are attached
    // when the owner of the inbox follows the link.
    await issueVerification(authData.user.id, email);

    return SIGNUP_ACCEPTED;
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

    if (!authUser.email) {
      throw new AppError(400, "No email found in Google account", "NO_EMAIL");
    }
    const email = authUser.email.trim().toLowerCase();

    // The provider itself vouches for the address — not merely that the
    // account has one. Only then may records keyed by email be attached.
    const oauthVerified = (authUser.identities ?? []).some(
      (i) =>
        i.provider !== "email" &&
        (i.identity_data?.email_verified === true || i.identity_data?.email_verified === "true") &&
        String(i.identity_data?.email ?? "").trim().toLowerCase() === email
    );
    const hasPassword = (authUser.identities ?? []).some((i) => i.provider === "email");

    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split("@")[0];
    const avatarUrl =
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      null;

    // Check if user already exists: this auth account first, then the address.
    const existing =
      (await prisma.user.findUnique({ where: { id: authUser.id }, include: { profile: true } })) ??
      (await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        include: { profile: true },
      }));

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

      // A profile row belonging to a different auth account is not this
      // person's to verify or claim through, whatever its email says.
      if (existing.id !== authUser.id) return updated;

      if (!existing.emailVerifiedAt) {
        if (!oauthVerified) return updated;
        if (!(await this.trustOAuthEmail(authUser.id, accessToken, hasPassword))) return updated;
      }
      await claimByEmail(authUser.id);
      return prisma.user.findUnique({ where: { id: authUser.id }, include: { profile: true } });
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

    // They may have been onboarded by email before this account existed —
    // attached only if the provider vouched for the address.
    if (oauthVerified && (await this.trustOAuthEmail(newUser.id, accessToken, hasPassword))) {
      await claimByEmail(newUser.id);
      return prisma.user.findUnique({ where: { id: newUser.id }, include: { profile: true } });
    }

    return newUser;
  }

  /**
   * Marks an address verified on the strength of an OAuth provider — after
   * shutting every other way into the account.
   *
   * Supabase attaches a Google sign-in to an existing account with the same
   * email, and that account may have been created by someone else typing this
   * address into the signup form. Their password is replaced with one nobody
   * knows and every other session is revoked before anything is attached. The
   * real owner keeps Google sign-in and can set a password via "Forgot password".
   *
   * Returns false, leaving the account unverified, if either step fails.
   */
  private async trustOAuthEmail(userId: string, accessToken: string, hasPassword: boolean) {
    if (hasPassword) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: randomBytes(32).toString("base64url"),
      });
      if (error) {
        logger.warn(`oauth verify: could not reset password for user ${userId} (status ${error.status ?? "n/a"})`);
        return false;
      }
    }

    const { error: outError } = await supabaseAdmin.auth.admin.signOut(accessToken, "others");
    if (outError) {
      logger.warn(`oauth verify: could not revoke other sessions for user ${userId} (status ${outError.status ?? "n/a"})`);
      return false;
    }

    await prisma.user.updateMany({
      where: { id: userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });
    return true;
  }

  verifyEmail(token: string, password: string) {
    return verifyEmail(token, password);
  }

  resendVerification(email: string) {
    return resendVerification(email);
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
