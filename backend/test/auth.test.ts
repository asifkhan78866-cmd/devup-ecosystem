/**
 * Regression tests for the removed local-JWT fallback.
 *
 * Supabase and Prisma are replaced with stubs before the middleware loads, so
 * nothing here touches the network or a database.
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";

const SRC = path.resolve(__dirname, "../src");

// The attacker's position: they hold the very secret this process is
// configured with. The old fallback verified against it and let them in.
const LEAKED_SECRET = randomBytes(64).toString("base64");
process.env.SUPABASE_JWT_SECRET = LEAKED_SECRET;

// ── Stubs ────────────────────────────────────────────────────────────────────
let getUserImpl: (token: string) => Promise<any>;
const getUserCalls: string[] = [];
let prismaCalls = 0;

function stub(relPath: string, exports: Record<string, unknown>) {
  const file = require.resolve(path.join(SRC, relPath));
  const m = new Module(file);
  m.filename = file;
  m.loaded = true;
  m.exports = exports;
  require.cache[file] = m;
}

stub("config/supabase", {
  supabaseAdmin: {
    auth: {
      getUser: async (token: string) => {
        getUserCalls.push(token);
        return getUserImpl(token);
      },
    },
  },
});
stub("lib/prisma", {
  prisma: {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        prismaCalls++;
        return { id: where.id, role: "ADMIN", email: "admin@example.test" };
      },
    },
  },
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { requireAuth } = require(path.join(SRC, "middleware/auth"));

/** A token signed exactly the way an attacker holding the old secret would. */
function forgeHs256(secret: string, payload: Record<string, unknown>) {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const body = `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}`;
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}

async function run(authorization?: string) {
  const req: any = { headers: authorization ? { authorization } : {} };
  let passed: unknown = "not-called";
  await requireAuth(req, {} as any, (err?: unknown) => {
    passed = err;
  });
  return { req, err: passed as any };
}

describe("requireAuth", () => {
  beforeEach(() => {
    getUserCalls.length = 0;
    prismaCalls = 0;
  });

  test("rejects a token forged with a leaked signing secret when Supabase does not vouch for it", async () => {
    getUserImpl = async () => ({
      data: { user: null },
      error: new AuthApiError("invalid JWT", 403, "bad_jwt"),
    });
    const forged = forgeHs256(LEAKED_SECRET, {
      sub: "00000000-0000-0000-0000-000000000001",
      role: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const { req, err } = await run(`Bearer ${forged}`);

    assert.equal(err?.statusCode, 401);
    assert.equal(err?.code, "INVALID_TOKEN");
    assert.equal(req.user, undefined);
    assert.equal(prismaCalls, 0, "no user lookup without Supabase's say-so");
    assert.deepEqual(getUserCalls, [forged], "Supabase is asked exactly once");
  });

  test("accepts a token Supabase vouches for", async () => {
    getUserImpl = async () => ({ data: { user: { id: "user-1" } }, error: null });
    const { req, err } = await run("Bearer good-token");
    assert.equal(err, undefined);
    assert.equal(req.user.id, "user-1");
  });

  test("an unreachable Supabase refuses with 503, not 401 and not a pass", async () => {
    getUserImpl = async () => ({
      data: { user: null },
      error: new AuthRetryableFetchError("fetch failed", 0),
    });
    const { req, err } = await run("Bearer anything");
    assert.equal(err?.statusCode, 503);
    assert.equal(err?.code, "AUTH_UNAVAILABLE");
    assert.equal(req.user, undefined);
  });

  test("a missing or empty bearer token is refused without calling Supabase", async () => {
    for (const header of [undefined, "Bearer ", "Basic abc"]) {
      const { err } = await run(header);
      assert.equal(err?.statusCode, 401);
      assert.equal(err?.code, "MISSING_TOKEN");
    }
    assert.equal(getUserCalls.length, 0);
  });
});

describe("no local JWT verification remains", () => {
  test("no source file signs, verifies or reads the JWT signing secret", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|js)$/.test(entry.name)) {
          const text = fs.readFileSync(full, "utf8");
          // `process.env.SUPABASE_JWT_SECRET` is allowed only for the "remove it" warning.
          if (/jsonwebtoken|jwt\.(verify|sign|decode)\(|(?<!process\.)env\.SUPABASE_JWT_SECRET/.test(text)) {
            offenders.push(path.relative(SRC, full));
          }
        }
      }
    };
    walk(SRC);
    assert.deepEqual(offenders, []);
  });
});

// ── Production start-up validation ───────────────────────────────────────────
describe("production configuration fails closed", () => {
  const fakeKey = (role: string) =>
    [
      Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
      Buffer.from(JSON.stringify({ iss: "supabase", role })).toString("base64url"),
      "c2lnbmF0dXJl",
    ].join(".");

  const valid = {
    NODE_ENV: "production",
    SUPABASE_URL: "https://example-project.supabase.co",
    SUPABASE_ANON_KEY: fakeKey("anon"),
    SUPABASE_SERVICE_ROLE_KEY: fakeKey("service_role"),
    DATABASE_URL: "postgresql://u:p@db.example.test:5432/postgres",
  };

  /** Loads env.ts in a clean process, from a directory with no .env to pick up. */
  function loadEnv(overrides: Record<string, string | undefined>) {
    const vars: Record<string, string> = { PATH: process.env.PATH ?? "" };
    for (const [k, v] of Object.entries({ ...valid, ...overrides })) if (v !== undefined) vars[k] = v;
    const result = spawnSync(
      process.execPath,
      ["-r", "ts-node/register", "-e", `require(${JSON.stringify(path.join(SRC, "config/env.ts"))})`],
      {
        cwd: fs.mkdtempSync(path.join(require("node:os").tmpdir(), "env-")),
        env: { ...vars, TS_NODE_PROJECT: path.resolve(__dirname, "../tsconfig.json"), NODE_PATH: path.resolve(__dirname, "../node_modules") },
        encoding: "utf8",
      }
    );
    return { code: result.status, output: `${result.stdout}${result.stderr}` };
  }

  test("a complete, well-formed configuration starts", () => {
    const { code, output } = loadEnv({});
    assert.equal(code, 0, output);
  });

  const cases: Array<[string, Record<string, string | undefined>, RegExp]> = [
    ["missing service-role key", { SUPABASE_SERVICE_ROLE_KEY: undefined }, /SUPABASE_SERVICE_ROLE_KEY/],
    ["missing anon key", { SUPABASE_ANON_KEY: undefined }, /SUPABASE_ANON_KEY/],
    ["missing Supabase URL", { SUPABASE_URL: undefined }, /SUPABASE_URL/],
    ["plain-http Supabase URL", { SUPABASE_URL: "http://example-project.supabase.co" }, /SUPABASE_URL must use https/],
    ["anon key used as the service-role key", { SUPABASE_SERVICE_ROLE_KEY: fakeKey("anon") }, /SUPABASE_SERVICE_ROLE_KEY is not/],
    ["garbage service-role key", { SUPABASE_SERVICE_ROLE_KEY: "not-a-key" }, /SUPABASE_SERVICE_ROLE_KEY is not/],
  ];

  for (const [name, overrides, expected] of cases) {
    test(`refuses to start: ${name}`, () => {
      const { code, output } = loadEnv(overrides);
      assert.equal(code, 1, output);
      assert.match(output, /Refusing to start in production/);
      assert.match(output, expected);
    });
  }

  test("a leftover signing secret is reported by name only, never by value", () => {
    const secret = randomBytes(64).toString("base64");
    const { code, output } = loadEnv({ SUPABASE_JWT_SECRET: secret });
    assert.equal(code, 0, output);
    assert.match(output, /SUPABASE_JWT_SECRET is set but no longer used/);
    assert.ok(!output.includes(secret), "secret value must never be printed");
  });

  test("rejected configuration output never contains the key values", () => {
    const leaky = fakeKey("anon");
    const { output } = loadEnv({ SUPABASE_SERVICE_ROLE_KEY: leaky });
    assert.ok(!output.includes(leaky));
  });
});
