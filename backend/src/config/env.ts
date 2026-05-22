import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("4000"),
  FRONTEND_URL: z.string(),
  CORS_ORIGINS: z.string(),
  
  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_JWT_SECRET: z.string(),

  DATABASE_URL: z.string(),
  DIRECT_URL: z.string(),

  UPSTASH_REDIS_REST_URL: z.string(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  REDIS_URL: z.string(),

  OPENROUTER_API_KEY: z.string(),
  OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),
  OPENROUTER_DEFAULT_MODEL: z.string().default("anthropic/claude-3.5-sonnet"),
  OPENROUTER_FAST_MODEL: z.string().default("meta-llama/llama-3.1-8b-instruct:free"),
  OPENROUTER_VISION_MODEL: z.string().default("google/gemini-flash-1.5"),

  RESEND_API_KEY: z.string(),
  RESEND_FROM_EMAIL: z.string().email(),
  RESEND_TEAM_EMAIL: z.string().email(),

  STORAGE_BUCKET_LOGOS: z.string().default("startup-logos"),
  STORAGE_BUCKET_BANNERS: z.string().default("startup-banners"),
  STORAGE_BUCKET_DOCUMENTS: z.string().default("legal-documents"),
  STORAGE_BUCKET_RESUMES: z.string().default("candidate-resumes"),
  STORAGE_BUCKET_PITCHDECKS: z.string().default("pitch-decks"),
  MAX_FILE_SIZE_MB: z.string().transform((v) => parseInt(v, 10)).default("10"),

  JWT_SECRET: z.string(),
  ADMIN_SECRET_KEY: z.string(),

  RATE_LIMIT_WINDOW_MS: z.string().transform((v) => parseInt(v, 10)).default("900000"),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform((v) => parseInt(v, 10)).default("100"),
  AI_RATE_LIMIT_MAX: z.string().transform((v) => parseInt(v, 10)).default("20"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
