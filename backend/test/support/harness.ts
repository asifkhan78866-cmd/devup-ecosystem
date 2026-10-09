/**
 * Shared HTTP test harness: the real Express app against a throwaway Postgres,
 * with Supabase auth and email replaced by in-memory stubs.
 *
 * TEST_DATABASE_URL must point at a local database — it is reset. Anything not
 * on localhost is refused, so a test can never touch a real environment.
 */
import Module from "node:module";
import path from "node:path";
import { execSync } from "node:child_process";
import { randomUUID, randomBytes, createHash } from "node:crypto";

export const SRC = path.resolve(__dirname, "../../src");

export function testDatabaseUrl(): string | null {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) return null;
  return /^postgres(ql)?:\/\/[^@]*@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url) ? url : null;
}

export type Person = { id: string; email: string; token: string; role: string };

export type HarnessOptions = {
  /** Extra modules to replace, by path under src/ (e.g. an external-API service). */
  stubs?: Record<string, unknown>;
  /** Environment set before the app loads (limits, feature flags). */
  env?: Record<string, string>;
};

export async function startHarness(dbUrl: string, opts: HarnessOptions = {}) {
  Object.assign(process.env, opts.env ?? {});
  process.env.DATABASE_URL = dbUrl;
  process.env.DIRECT_URL = dbUrl;
  process.env.NODE_ENV = "test";
  process.env.REDIS_ENABLED = "false";
  process.env.FRONTEND_URL = "https://app.example.test";

  const tokens = new Map<string, string>();
  const mails: Array<{ to: string; subject: string; html?: string }> = [];
  /** Every object written to (stubbed) storage, in order. */
  const stored: Array<{ bucket: string; path: string; contentType?: string; size: number }> = [];
  // Not named `exports`: compiled to CommonJS, that name would shadow the
  // module's own exports object and `SRC` would resolve to undefined.
  const stub = (rel: string, value: unknown) => {
    const file = require.resolve(path.join(SRC, rel));
    const m = new Module(file);
    m.filename = file;
    m.loaded = true;
    m.exports = value;
    require.cache[file] = m;
  };
  stub("config/supabase", {
    supabase: {},
    // Password sign-in: every harness person signs in with `pw-<their id>`.
    createSessionClient: () => ({
      auth: {
        signInWithPassword: async ({ password }: { email: string; password: string }) => {
          const id = password.startsWith("pw-") ? password.slice(3) : "";
          if (![...tokens.values()].includes(id)) {
            return { data: { session: null }, error: { status: 400, code: "invalid_credentials", message: "Invalid login credentials" } };
          }
          return { data: { session: { access_token: `tok-${id}`, refresh_token: `r-${id}`, expires_at: 0 }, user: { id } }, error: null };
        },
      },
    }),
    verifySupabaseAuthConfig: async () => true,
    supabaseAdmin: {
      auth: {
        getUser: async (t: string) =>
          tokens.has(t)
            ? { data: { user: { id: tokens.get(t) } }, error: null }
            : { data: { user: null }, error: { status: 403, code: "bad_jwt", message: "invalid JWT" } },
        admin: {},
      },
      storage: {
        from: (bucket: string) => ({
          upload: async (p: string, body: Buffer, o: { contentType?: string } = {}) => {
            stored.push({ bucket, path: p, contentType: o.contentType, size: body?.length ?? 0 });
            return { data: { path: p }, error: null };
          },
          getPublicUrl: (p: string) => ({ data: { publicUrl: `https://storage.example.test/${p}` } }),
          createSignedUrl: async (p: string) => ({ data: { signedUrl: `https://storage.example.test/signed/${p}` }, error: null }),
          remove: async () => ({ error: null }),
        }),
      },
    },
  });
  stub("lib/resend", {
    MAIL_FROM: "test@example.test",
    resend: { emails: { send: async (p: any) => (mails.push(p), { data: {}, error: null }) } },
    sendTeamInviteEmail: async () => undefined,
    sendDocumentReadyEmail: async () => undefined,
    sendDocumentSignedEmail: async () => undefined,
    // Every legacy template renders to a placeholder; tests assert on behaviour, not markup.
    EmailTemplates: new Proxy({}, { get: () => () => "<p>stub</p>" }),
  });

  for (const [rel, value] of Object.entries(opts.stubs ?? {})) stub(rel, value);

  execSync("npx prisma db push --force-reset --skip-generate --accept-data-loss", {
    cwd: path.resolve(SRC, ".."),
    env: { ...process.env, DATABASE_URL: dbUrl, DIRECT_URL: dbUrl },
    stdio: "ignore",
  });

  /* eslint-disable @typescript-eslint/no-var-requires */
  const prisma = require(path.join(SRC, "lib/prisma")).prisma;
  const { app } = require(path.join(SRC, "app"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;

  const uniq = () => randomBytes(3).toString("hex");
  const sha = (s: string) => createHash("sha256").update(s).digest("hex");

  async function call(method: string, p: string, token?: string, body?: unknown, headers: Record<string, string> = {}) {
    const res = await fetch(`${base}${p}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json: any = {};
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { status: res.status, body: json, headers: res.headers };
  }

  async function person(tag: string, role = "STUDENT", profile: Record<string, unknown> = {}): Promise<Person> {
    const id = randomUUID();
    const email = `${tag}-${uniq()}@example.test`;
    await prisma.user.create({
      data: { id, email, role, emailVerifiedAt: new Date(), profile: { create: { name: `${tag} person`, ...profile } } },
    });
    const token = `tok-${id}`;
    tokens.set(token, id);
    return { id, email, token, role };
  }

  async function startup(founder: Person, extra: Record<string, unknown> = {}) {
    const s = await prisma.startup.create({
      data: {
        name: `S-${uniq()}`, slug: `s-${uniq()}`, tagline: "t", description: "d", domain: "AI_ML", stage: "IDEA",
        foundedYear: 2026, headcount: "1-5", location: "X", founderId: founder.id, isVerified: true, isActive: true,
        code: randomBytes(2).toString("hex").toUpperCase().slice(0, 4),
        founders: { connect: [{ id: founder.id }] },
        ...extra,
      },
    });
    await prisma.startupMember.create({
      data: { startupId: s.id, userId: founder.id, email: founder.email, role: "FOUNDER", status: "ACTIVE", invitedBy: founder.id, inviteToken: sha(randomUUID()) },
    });
    return s;
  }

  /** Multipart POST (file uploads), with extra headers such as auth or a lead token. */
  async function upload(p: string, form: FormData, headers: Record<string, string> = {}) {
    const res = await fetch(`${base}${p}`, { method: "POST", body: form, headers });
    const text = await res.text();
    let json: any = {};
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { status: res.status, body: json };
  }

  return {
    prisma, call, upload, person, startup, mails, stored, uniq, sha, origin: base,
    close: async () => {
      server.close();
      await prisma.$disconnect();
    },
  };
}
