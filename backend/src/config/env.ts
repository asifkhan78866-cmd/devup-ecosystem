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
  // Opt-in. When false the app degrades gracefully: in-memory rate limiting, no queues.
  REDIS_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v.toLowerCase() === "true"),

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

  /**
   * Outside production, mail is off unless you deliberately turn it on. Running
   * a test against the real database must not put anything in a real person's
   * inbox — set EMAIL_ALLOWLIST to a few addresses when you need to see a real
   * send, and everything else is dropped and logged.
   */
  EMAIL_ENABLED: z.string().optional().transform((v) => (v == null ? undefined : v !== "false")),
  EMAIL_ALLOWLIST: z
    .string()
    .default("")
    .transform((v) => v.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)),

  STORAGE_BUCKET_LOGOS: z.string().default("startup-logos"),
  STORAGE_BUCKET_BANNERS: z.string().default("startup-banners"),
  STORAGE_BUCKET_DOCUMENTS: z.string().default("legal-documents"),
  STORAGE_BUCKET_RESUMES: z.string().default("candidate-resumes"),
  STORAGE_BUCKET_PITCHDECKS: z.string().default("pitch-decks"),
  MAX_FILE_SIZE_MB: z.string().default("10").transform((v) => Number.parseInt(v, 10)),

  JWT_EXPIRES_IN: z.string().default("7d"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),
  ADMIN_REGISTRATION_SECRET: z.string().default("dev-admin-secret-key"),

  /**
   * Opt-in for the hardcoded local admin login. Never set this anywhere real —
   * it exists so the admin panel can be opened without a Supabase round trip.
   */
  ALLOW_DEV_LOGIN: z.string().optional().transform((v) => v === "true"),

  RATE_LIMIT_WINDOW_MS: z.string().default("900000").transform((v) => Number.parseInt(v, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform((v) => Number.parseInt(v, 10)),
  AI_RATE_LIMIT_MAX: z.string().default("20").transform((v) => Number.parseInt(v, 10)),
  AI_RATE_LIMIT_WINDOW_MS: z.string().default("3600000").transform((v) => Number.parseInt(v, 10)),

  LOG_LEVEL: z.string().default("debug"),
  LOG_FILE: z.string().default("logs/app.log"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Absolute public origin, used for logo and links inside emails — FRONTEND_URL
  // points at localhost in development, which would break images in an inbox.
  PUBLIC_SITE_URL: z.string().default("https://www.devupecosystem.com"),

  // Web Push (VAPID). Generate with: npx web-push generate-vapid-keys
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
});

let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (err) {
  if (err instanceof z.ZodError) {
    console.error("❌ Invalid environment variables:", err.issues);
  } else {
    console.error("❌ Failed to parse environment variables:", err);
  }
  process.exit(1);
}

/**
 * Every variable above has a development default so a fresh clone runs without
 * setup. That convenience is a liability in production: a deploy that forgets
 * SUPABASE_SERVICE_ROLE_KEY or ADMIN_REGISTRATION_SECRET would otherwise boot
 * happily on a well-known dev value, and anyone who has read this repository
 * could register themselves as an admin.
 *
 * So in production the defaults are treated as missing, and the process refuses
 * to start rather than run insecurely.
 */
if (env.NODE_ENV === "production") {
  const problems: string[] = [];

  const mustBeSet: Array<[string, string, string]> = [
    ["SUPABASE_URL", env.SUPABASE_URL, "http://localhost:54321"],
    ["SUPABASE_ANON_KEY", env.SUPABASE_ANON_KEY, "dev-anon-key"],
    ["SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY, "dev-service-role-key"],
    ["SUPABASE_JWT_SECRET", env.SUPABASE_JWT_SECRET, "dev-jwt-secret-min-32-characters-long"],
    ["ADMIN_REGISTRATION_SECRET", env.ADMIN_REGISTRATION_SECRET, "dev-admin-secret-key"],
    ["RESEND_API_KEY", env.RESEND_API_KEY, "re_dev_placeholder"],
  ];
  for (const [name, value, devDefault] of mustBeSet) {
    if (!value || value === devDefault) problems.push(`${name} is not set (still the development default)`);
  }

  if (env.DATABASE_URL.includes("localhost")) problems.push("DATABASE_URL still points at localhost");
  if (env.CORS_ORIGINS.includes("localhost")) problems.push("CORS_ORIGINS still allows localhost");
  if (env.ALLOW_DEV_LOGIN) problems.push("ALLOW_DEV_LOGIN is enabled — this is a password bypass");

  if (problems.length > 0) {
    console.error("Refusing to start in production:\n  - " + problems.join("\n  - "));
    process.exit(1);
  }
}

export { env };
