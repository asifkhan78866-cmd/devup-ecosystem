import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../config/redis";
import { env } from "../config/env";

// Without Redis these fall back to express-rate-limit's in-memory store, which
// counts per process — limits are effectively multiplied across instances.
// Fine for single-instance dev; production should run with REDIS_ENABLED=true.

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis!.call(args[0], ...args.slice(1)) as any,
  }) : undefined,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
    code: "RATE_LIMITED",
  },
});

/**
 * Sign-in and registration. Far tighter than the global limit and keyed on the
 * email being tried, not just the IP — credential stuffing rotates through
 * addresses from one host, and password spraying does the reverse. Counting
 * both means neither pattern gets a free run.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Successful sign-ins should not eat into someone's allowance.
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = String((req.body as { email?: string } | undefined)?.email ?? "").toLowerCase();
    return `${ipKeyGenerator(req.ip ?? "")}:${email}`;
  },
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis!.call(args[0], ...args.slice(1)) as any,
  }) : undefined,
  message: {
    success: false,
    error: "Too many attempts. Please wait 15 minutes and try again.",
    code: "TOO_MANY_ATTEMPTS",
  },
});

/**
 * AI startup research: every call crawls a website and spends OpenRouter
 * credit. Three limits, applied in order after authentication:
 *
 *   per account   — the configured AI_RESEARCH_RATE_LIMIT per window. Keyed on
 *                   the authenticated user id, so changing the email, startup
 *                   name or any other body field does not reset it.
 *   per client IP — because accounts are free to create, many accounts from one
 *                   host share a budget. The IP is the trusted client address
 *                   (see config/proxy.ts), not a forwarded header a client wrote.
 *   global daily  — a ceiling on total spend however the traffic is spread.
 */
const aiExceeded = {
  success: false,
  error: "AI research limit reached. Please try again later.",
  code: "AI_RATE_LIMITED",
};
const aiStore = (prefix: string) =>
  redis
    ? new RedisStore({ sendCommand: (...args: string[]) => redis!.call(args[0], ...args.slice(1)) as any, prefix })
    : undefined;

export const aiResearchUserLimiter = rateLimit({
  windowMs: env.AI_RESEARCH_RATE_WINDOW_MS,
  max: env.AI_RESEARCH_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  // Unauthenticated requests never reach this (requireAuth runs first); if one
  // did, it falls back to the client IP rather than a shared or empty key.
  keyGenerator: (req) => (req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip ?? "")}`),
  store: aiStore("rl-ai-user:"),
  message: aiExceeded,
});

export const aiResearchIpLimiter = rateLimit({
  windowMs: env.AI_RESEARCH_RATE_WINDOW_MS,
  max: env.AI_RESEARCH_IP_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `ip:${ipKeyGenerator(req.ip ?? "")}`,
  store: aiStore("rl-ai-ip:"),
  message: aiExceeded,
});

export const aiResearchGlobalLimiter = rateLimit({
  windowMs: 24 * 60 * 60_000,
  max: env.AI_RESEARCH_DAILY_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: () => "global",
  store: aiStore("rl-ai-global:"),
  message: aiExceeded,
});

/**
 * Public hackathon registration and "email me my link". Keyed on the hackathon
 * and the phone number being used, so one team's number cannot be hammered and
 * an inbox cannot be flooded — without relying on the client IP.
 */
export const hackathonLeadLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const phone = String((req.body as { phone?: string } | undefined)?.phone ?? "");
    return `lead:${req.params.id ?? ""}:${phone || ipKeyGenerator(req.ip ?? "")}`;
  },
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis!.call(args[0], ...args.slice(1)) as any,
    prefix: "rl-lead:",
  }) : undefined,
  message: {
    success: false,
    error: "Too many attempts for this number. Please wait 15 minutes and try again.",
    code: "TOO_MANY_ATTEMPTS",
  },
});
