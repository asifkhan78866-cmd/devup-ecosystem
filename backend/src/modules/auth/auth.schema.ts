import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["FOUNDER", "STUDENT", "INVESTOR"]).optional().default("STUDENT"),
    adminSecret: z.string().optional(),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string()
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1).max(4096),
  })
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(20).max(200),
    password: z.string().min(8).max(128),
  })
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email(),
  })
});

export const authResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    role: z.string()
  }),
  token: z.string()
});
