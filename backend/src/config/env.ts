import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("4000"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  ADMIN_URL: z.string().default("http://localhost:3001"),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001,http://localhost:3002"),
  
  SUPABASE_URL: z.string().default("http://localhost:54321"),
  SUPABASE_ANON_KEY: z.string().default("dev-anon-key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default("dev-service-role-key"),
  SUPABASE_JWT_SECRET: z.string().default("dev-jwt-secret-min-32-characters-long"),

  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/devup"),
  DIRECT_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/devup"),

  UPSTASH_REDIS_REST_URL: z.string().default("http://localhost:6379"),
  UPSTASH_REDIS_REST_TOKEN: z.string().default("dev-redis-token"),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  OPENROUTER_API_KEY: z.string().default("sk-or-dev-placeholder"),
  OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),
  OPENROUTER_DEFAULT_MODEL: z.string().default("anthropic/claude-3.5-sonnet"),
  OPENROUTER_FAST_MODEL: z.string().default("meta-llama/llama-3.1-8b-instruct:free"),
  OPENROUTER_VISION_MODEL: z.string().default("google/gemini-flash-1.5"),

  RESEND_API_KEY: z.string().default("re_dev_placeholder"),
  RESEND_FROM_EMAIL: z.string().default("noreply@devup.local"),
  RESEND_FROM_NAME: z.string().default("DevUp Ecosystem"),
  RESEND_TEAM_EMAIL: z.string().default("team@devup.local"),
  RESEND_ADMIN_EMAIL: z.string().default("admin@devup.local"),

  STORAGE_BUCKET_LOGOS: z.string().default("startup-logos"),
  STORAGE_BUCKET_BANNERS: z.string().default("startup-banners"),
  STORAGE_BUCKET_DOCUMENTS: z.string().default("legal-documents"),
  STORAGE_BUCKET_RESUMES: z.string().default("candidate-resumes"),
  STORAGE_BUCKET_PITCHDECKS: z.string().default("pitch-decks"),
  MAX_FILE_SIZE_MB: z.string().default("10").transform((v) => Number.parseInt(v, 10)),

  JWT_SECRET: z.string().default("dev-jwt-secret-key-at-least-32-chars"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),
  ADMIN_REGISTRATION_SECRET: z.string().default("dev-admin-secret-key"),

  RATE_LIMIT_WINDOW_MS: z.string().default("900000").transform((v) => Number.parseInt(v, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform((v) => Number.parseInt(v, 10)),
  AI_RATE_LIMIT_MAX: z.string().default("20").transform((v) => Number.parseInt(v, 10)),
  AI_RATE_LIMIT_WINDOW_MS: z.string().default("3600000").transform((v) => Number.parseInt(v, 10)),

  LOG_LEVEL: z.string().default("debug"),
  LOG_FILE: z.string().default("logs/app.log"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.issues);
  process.exit(1);
}

export const env = _env.data;
