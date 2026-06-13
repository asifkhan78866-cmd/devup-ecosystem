import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../config/redis";
import { env } from "../config/env";

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

export const aiLimiter = rateLimit({
  windowMs: env.AI_RATE_LIMIT_WINDOW_MS,
  max: env.AI_RATE_LIMIT_MAX, // 20
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new RedisStore({
    sendCommand: (...args: string[]) => redis!.call(args[0], ...args.slice(1)) as any,
  }) : undefined,
  message: {
    success: false,
    error: "AI rate limit exceeded. Please try again next hour.",
    code: "AI_RATE_LIMITED",
  },
});
