/**
 * Startup-scoped authorization: the cross-startup attack matrix.
 *
 * Runs over HTTP against the real Express app and a real Postgres (set
 * TEST_DATABASE_URL to a throwaway local database — it is wiped; anything not
 * on localhost is refused). Supabase and email are in-memory stubs. Every
 * "denied" case also checks the database did not change.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { randomUUID, randomBytes, createHash } from "node:crypto";

const TEST_DB = process.env.TEST_DATABASE_URL;
const local = TEST_DB ? /^postgres(ql)?:\/\/[^@]*@(localhost|127\.0\.0\.1)(:\d+)?\//.test(TEST_DB) : false;

const SRC = path.resolve(__dirname, "../src");

// ── Static guard: no handler lets the request body override server-resolved fields ──
describe("request bodies cannot override server-resolved fields", () => {
  test("no object literal spreads req.body after its own keys", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.name.endsWith(".ts")) {
          const text = fs.readFileSync(full, "utf8");
          // `{ startupId: …, actorId: …, ...req.body }` — the body wins any clash.
          const re = /\{[^{}]*?\b[A-Za-z_$][\w$]*\s*:[^{}]*?\.\.\.req\.body\b[^{}]*\}/g;
          for (const m of text.matchAll(re)) {
            offenders.push(`${path.relative(SRC, full)}:${text.slice(0, m.index).split("\n").length}`);
          }
        }
      }
    };
    walk(SRC);
    assert.deepEqual(offenders, []);
  });
});

if (!TEST_DB || !local) {
  test("startup authorization matrix (needs TEST_DATABASE_URL on localhost)", { skip: true }, () => {});
} else {
  run(TEST_DB);
}

function run(dbUrl: string) {
  process.env.DATABASE_URL = dbUrl;
  process.env.DIRECT_URL = dbUrl;
  process.env.NODE_ENV = "test";
  process.env.REDIS_ENABLED = "false";
  process.env.FRONTEND_URL = "https://app.example.test";

  // Bearer token → user id. requireAuth asks "Supabase", which answers from here.
  const tokens = new Map<string, string>();
  const stub = (rel: string, exports: unknown) => {
    const file = require.resolve(path.join(SRC, rel));
    const m = new Module(file);
    m.filename = file;
    m.loaded = true;
    m.exports = exports;
    require.cache[file] = m;
  };
  stub("config/supabase", {
    supabase: {},
    createSessionClient: () => ({ auth: {} }),
    verifySupabaseAuthConfig: async () => true,
    supabaseAdmin: {
      auth: {
        getUser: async (t: string) =>
          tokens.has(t)
            ? { data: { user: { id: tokens.get(t) } }, error: null }
            : { data: { user: null }, error: { status: 403, code: "bad_jwt", message: "invalid JWT" } },
        admin: {},
      },
    },
  });
  stub("lib/resend", {
    MAIL_FROM: "test@example.test",
    resend: { emails: { send: async () => ({ data: {}, error: null }) } },
    sendTeamInviteEmail: async () => undefined,
  });

  /* eslint-disable @typescript-eslint/no-var-requires */
  let prisma: any, base: string, server: any, StartupsService: any;
  const sha = (s: string) => createHash("sha256").update(s).digest("hex");
  const uniq = () => randomBytes(3).toString("hex");

  async function call(method: string, p: string, token?: string, body?: unknown) {
    const res = await fetch(`${base}${p}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, body: json as any };
  }

  type Person = { id: string; token: string; email: string; seatId?: string };
  async function person(tag: string, role = "STUDENT"): Promise<Person> {
    const id = randomUUID();
    const email = `${tag}-${uniq()}@example.test`;
    await prisma.user.create({ data: { id, email, role, emailVerifiedAt: new Date() } });
    const token = `tok-${id}`;
    tokens.set(token, id);
    return { id, token, email };
  }
  async function seat(startupId: string, p: Person, role: string, status = "ACTIVE") {
    const row = await prisma.startupMember.create({
      data: { startupId, userId: p.id, email: p.email, role, status, invitedBy: p.id, inviteToken: sha(randomUUID()), joinedAt: new Date() },
    });
    p.seatId = row.id;
    return row;
  }
  async function startup(founder: Person) {
    const s = await prisma.startup.create({
      data: {
        name: `S-${uniq()}`, slug: `s-${uniq()}`, tagline: "t", description: "d", domain: "AI_ML", stage: "IDEA",
        foundedYear: 2026, headcount: "1-5", location: "X", founderId: founder.id,
        code: randomBytes(2).toString("hex").toUpperCase().replace(/[^A-Z0-9]/g, "Z").slice(0, 4),
      },
    });
    return s;
  }

  // Two startups, three people each, plus an outsider and DevUp staff.
  type Tenant = { s: any; founder: Person; cofounder: Person; employee: Person; intern: Person; pendingId: string };
  let A: Tenant, B: Tenant, outsider: Person, staff: Person;
  async function tenant(tag: string): Promise<Tenant> {
    const founder = await person(`${tag}-founder`, "FOUNDER");
    const s = await startup(founder);
    const cofounder = await person(`${tag}-cofounder`, "FOUNDER");
    const employee = await person(`${tag}-employee`);
    const intern = await person(`${tag}-intern`);
    await seat(s.id, founder, "FOUNDER");
    await seat(s.id, cofounder, "FOUNDER");
    await seat(s.id, employee, "EMPLOYEE");
    await seat(s.id, intern, "INTERN");
    const pending = await prisma.startupMember.create({
      data: { startupId: s.id, email: `${tag}-pending-${uniq()}@example.test`, role: "MEMBER", status: "INVITED", invitedBy: founder.id, inviteToken: sha(randomUUID()) },
    });
    return { s, founder, cofounder, employee, intern, pendingId: pending.id };
  }
  const roleOf = async (seatId: string) => (await prisma.startupMember.findUnique({ where: { id: seatId } }))?.role ?? null;
  const exists = async (seatId: string) => Boolean(await prisma.startupMember.findUnique({ where: { id: seatId } }));

  before(async () => {
    execSync("npx prisma db push --force-reset --skip-generate --accept-data-loss", {
      cwd: path.resolve(__dirname, ".."),
      env: { ...process.env, DATABASE_URL: dbUrl, DIRECT_URL: dbUrl },
      stdio: "ignore",
    });
    prisma = require(path.join(SRC, "lib/prisma")).prisma;
    StartupsService = require(path.join(SRC, "modules/startups/startups.service")).StartupsService;
    const { app } = require(path.join(SRC, "app"));
    server = app.listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    base = `http://127.0.0.1:${server.address().port}`;

    A = await tenant("a");
    B = await tenant("b");
    outsider = await person("outsider");
    staff = await person("staff", "ADMIN");
  });
  after(async () => {
    server?.close();
    await prisma?.$disconnect();
  });

  // ── Listing ────────────────────────────────────────────────────────────────
  describe("member listing", () => {
    test("1. a founder lists their own startup's members — scoped, minimal", async () => {
      const r = await call("GET", `/api/startups/${A.s.id}/members`, A.founder.token);
      assert.equal(r.status, 200);
      const ids = r.body.data.map((m: any) => m.id).sort();
      const expected = (await prisma.startupMember.findMany({ where: { startupId: A.s.id }, select: { id: true } })).map((m: any) => m.id).sort();
      assert.deepEqual(ids, expected, "exactly startup A's members");
      const me = r.body.data.find((m: any) => m.isMe);
      assert.equal(me.id, A.founder.seatId);
      for (const m of r.body.data) {
        assert.equal("userId" in m, false, "no account ids");
        assert.equal("inviteToken" in m, false);
        assert.ok(!m.user || !("email" in m.user) && !("phone" in (m.user.profile ?? {})), "no private profile fields");
      }
      assert.ok(r.body.data.every((m: any) => typeof m.email === "string"), "founders see addresses");
    });

    test("2/9. a founder of A cannot list B — same 404 as a startup that does not exist", async () => {
      const cross = await call("GET", `/api/startups/${B.s.id}/members`, A.founder.token);
      const ghost = await call("GET", `/api/startups/${randomUUID()}/members`, A.founder.token);
      assert.equal(cross.status, 404);
      assert.deepEqual(cross.body, ghost.body, "indistinguishable from a missing startup");
    });

    test("employees and interns of A cannot list B; an outsider cannot list A", async () => {
      for (const who of [A.employee, A.intern, outsider]) {
        const target = who === outsider ? A : B;
        assert.equal((await call("GET", `/api/startups/${target.s.id}/members`, who.token)).status, 404);
      }
    });

    test("13. anonymous callers are refused", async () => {
      assert.equal((await call("GET", `/api/startups/${A.s.id}/members`)).status, 401);
    });

    test("an employee sees active colleagues by name only — no addresses, no pending invites", async () => {
      const r = await call("GET", `/api/startups/${A.s.id}/members`, A.employee.token);
      assert.equal(r.status, 200);
      assert.ok(r.body.data.every((m: any) => !("email" in m)));
      assert.ok(!r.body.data.some((m: any) => m.id === A.pendingId));
    });
  });

  // ── Role changes ───────────────────────────────────────────────────────────
  describe("role changes", () => {
    const patch = (sid: string, mid: string, token: string | undefined, role: string) =>
      call("PATCH", `/api/startups/${sid}/members/${mid}/role`, token, { role });

    test("3. a founder changes a role in their own startup", async () => {
      const r = await patch(A.s.id, A.intern.seatId!, A.founder.token, "EMPLOYEE");
      assert.equal(r.status, 200);
      assert.equal(await roleOf(A.intern.seatId!), "EMPLOYEE");
      await prisma.startupMember.update({ where: { id: A.intern.seatId }, data: { role: "INTERN" } });
    });

    test("4/12. startup A + a member of B: not found, B untouched", async () => {
      const r = await patch(A.s.id, B.employee.seatId!, A.founder.token, "ADMIN");
      assert.equal(r.status, 404);
      assert.equal(await roleOf(B.employee.seatId!), "EMPLOYEE");
    });

    test("10. forged startupId: B's startup + B's member, as A's founder", async () => {
      assert.equal((await patch(B.s.id, B.employee.seatId!, A.founder.token, "ADMIN")).status, 404);
      assert.equal(await roleOf(B.employee.seatId!), "EMPLOYEE");
    });

    test("12. startup B + a member of A: not found, A untouched", async () => {
      assert.equal((await patch(B.s.id, A.employee.seatId!, A.founder.token, "ADMIN")).status, 404);
      assert.equal(await roleOf(A.employee.seatId!), "EMPLOYEE");
    });

    test("11. forged memberId: unknown id is not found", async () => {
      assert.equal((await patch(A.s.id, "c" + uniq() + uniq(), A.founder.token, "ADMIN")).status, 404);
    });

    test("7. an employee cannot promote themselves", async () => {
      assert.equal((await patch(A.s.id, A.employee.seatId!, A.employee.token, "ADMIN")).status, 403);
      assert.equal((await patch(A.s.id, A.employee.seatId!, A.employee.token, "FOUNDER")).status, 403);
      assert.equal(await roleOf(A.employee.seatId!), "EMPLOYEE");
    });

    test("an employee cannot change a colleague's role either", async () => {
      assert.equal((await patch(A.s.id, A.intern.seatId!, A.employee.token, "ADMIN")).status, 403);
      assert.equal(await roleOf(A.intern.seatId!), "INTERN");
    });

    test("nobody changes their own role — not even DevUp staff who hold a seat", async () => {
      const s = await prisma.startupMember.create({
        data: { startupId: A.s.id, userId: staff.id, email: staff.email, role: "MEMBER", status: "ACTIVE", invitedBy: A.founder.id, inviteToken: sha(randomUUID()) },
      });
      assert.equal((await patch(A.s.id, s.id, staff.token, "ADMIN")).status, 403);
      assert.equal(await roleOf(s.id), "MEMBER");
      await prisma.startupMember.delete({ where: { id: s.id } });
    });

    test("8. an employee cannot touch a founder's role", async () => {
      assert.equal((await patch(A.s.id, A.founder.seatId!, A.employee.token, "MEMBER")).status, 403);
      assert.equal(await roleOf(A.founder.seatId!), "FOUNDER");
    });

    test("founder authority is not manufactured by a role change", async () => {
      assert.equal((await patch(A.s.id, A.employee.seatId!, A.founder.token, "FOUNDER")).status, 403);
      assert.equal((await patch(A.s.id, A.employee.seatId!, A.founder.token, "OWNER")).status, 403);
      assert.equal(await roleOf(A.employee.seatId!), "EMPLOYEE");
    });

    test("a founder cannot demote a co-founder, nor change their own role", async () => {
      assert.equal((await patch(A.s.id, A.cofounder.seatId!, A.founder.token, "MEMBER")).status, 403);
      assert.equal((await patch(A.s.id, A.founder.seatId!, A.founder.token, "MEMBER")).status, 403);
      assert.equal(await roleOf(A.cofounder.seatId!), "FOUNDER");
      assert.equal(await roleOf(A.founder.seatId!), "FOUNDER");
    });

    test("a forged role value is rejected", async () => {
      assert.equal((await patch(A.s.id, A.intern.seatId!, A.founder.token, "SUPER_ADMIN")).status, 400);
      assert.equal(await roleOf(A.intern.seatId!), "INTERN");
    });

    test("DevUp staff may demote a founder, but never the last one", async () => {
      const f = await person("solo-founder", "FOUNDER");
      const s = await startup(f);
      await seat(s.id, f, "FOUNDER");
      const r = await patch(s.id, f.seatId!, staff.token, "MEMBER");
      assert.equal(r.status, 409);
      assert.equal(r.body.code, "LAST_OWNER");
      assert.equal(await roleOf(f.seatId!), "FOUNDER");
    });
  });

  // ── Removal ────────────────────────────────────────────────────────────────
  describe("removal", () => {
    const del = (sid: string, mid: string, token?: string) => call("DELETE", `/api/startups/${sid}/members/${mid}`, token);

    test("5. a founder removes a member of their own startup", async () => {
      const temp = await person("temp");
      await seat(A.s.id, temp, "MEMBER");
      assert.equal((await del(A.s.id, temp.seatId!, A.founder.token)).status, 200);
      assert.equal(await exists(temp.seatId!), false);
    });

    test("6. a founder of A cannot remove B's members by any id combination", async () => {
      assert.equal((await del(A.s.id, B.employee.seatId!, A.founder.token)).status, 404);
      assert.equal((await del(B.s.id, B.employee.seatId!, A.founder.token)).status, 404);
      assert.equal((await del(B.s.id, A.employee.seatId!, A.founder.token)).status, 404);
      assert.equal(await exists(B.employee.seatId!), true);
      assert.equal(await exists(A.employee.seatId!), true);
    });

    test("employees and interns cannot remove anyone; anonymous is refused", async () => {
      assert.equal((await del(A.s.id, A.intern.seatId!, A.employee.token)).status, 403);
      assert.equal((await del(A.s.id, A.employee.seatId!, A.intern.token)).status, 403);
      assert.equal((await del(A.s.id, A.intern.seatId!)).status, 401);
      assert.equal(await exists(A.intern.seatId!), true);
    });

    test("a founder cannot remove a co-founder or themselves", async () => {
      assert.equal((await del(A.s.id, A.cofounder.seatId!, A.founder.token)).status, 403);
      assert.equal((await del(A.s.id, A.founder.seatId!, A.founder.token)).status, 403);
      assert.equal(await exists(A.cofounder.seatId!), true);
    });

    test("DevUp staff may remove a founder, but never the last one", async () => {
      const f1 = await person("pair-1", "FOUNDER");
      const f2 = await person("pair-2", "FOUNDER");
      const s = await startup(f1);
      await seat(s.id, f1, "FOUNDER");
      await seat(s.id, f2, "FOUNDER");
      assert.equal((await del(s.id, f1.seatId!, staff.token)).status, 200);
      const r = await del(s.id, f2.seatId!, staff.token);
      assert.equal(r.status, 409);
      assert.equal(await exists(f2.seatId!), true);
    });
  });

  // ── Concurrency ────────────────────────────────────────────────────────────
  describe("15. concurrent conflicting operations stay safe", () => {
    test("removing both founders at once never leaves a startup ownerless", async () => {
      for (let round = 0; round < 8; round++) {
        const f1 = await person(`race-${round}-1`, "FOUNDER");
        const f2 = await person(`race-${round}-2`, "FOUNDER");
        const s = await startup(f1);
        await seat(s.id, f1, "FOUNDER");
        await seat(s.id, f2, "FOUNDER");
        const results = await Promise.all([
          call("DELETE", `/api/startups/${s.id}/members/${f1.seatId}`, staff.token),
          call("DELETE", `/api/startups/${s.id}/members/${f2.seatId}`, staff.token),
        ]);
        const owners = await prisma.startupMember.count({ where: { startupId: s.id, role: { in: ["FOUNDER", "OWNER"] }, status: "ACTIVE" } });
        assert.equal(owners, 1, `round ${round}: statuses ${results.map((r) => r.status)}`);
      }
    });

    test("a role change racing a removal of the same member cannot resurrect or duplicate it", async () => {
      const temp = await person("race-member");
      await seat(A.s.id, temp, "MEMBER");
      const [chg, rm] = await Promise.all([
        call("PATCH", `/api/startups/${A.s.id}/members/${temp.seatId}/role`, A.founder.token, { role: "EMPLOYEE" }),
        call("DELETE", `/api/startups/${A.s.id}/members/${temp.seatId}`, A.founder.token),
      ]);
      assert.equal(rm.status, 200);
      assert.ok([200, 404].includes(chg.status));
      assert.equal(await exists(temp.seatId!), false);
      assert.equal(await prisma.startupMember.count({ where: { userId: temp.id } }), 0);
    });
  });

  // ── Ownership / startup records ────────────────────────────────────────────
  describe("14. ownership cannot be created or moved across startups", () => {
    test("creating a startup always makes the caller the owner, whatever founderId says", async () => {
      const svc = new StartupsService();
      const s = await svc.createStartup(
        { name: "New", slug: `new-${uniq()}`, tagline: "t", description: "d", domain: "AI_ML", stage: "IDEA", foundedYear: 2026, headcount: "1", location: "X", founderId: B.founder.id },
        { id: A.founder.id, role: "FOUNDER" }
      );
      assert.equal(s.founderId, A.founder.id);
      const owners = await prisma.startupMember.findMany({ where: { startupId: s.id }, select: { userId: true, role: true } });
      assert.deepEqual(owners, [{ userId: A.founder.id, role: "FOUNDER" }]);
    });

    test("editing a startup cannot pull another startup's records in, re-assign ownership, or self-verify", async () => {
      const bEmployee = await prisma.employee.create({
        data: { startupId: B.s.id, employeeCode: `E-${uniq()}`, fullName: "B person", email: `bp-${uniq()}@example.test`, designation: "Eng", employmentType: "FULL_TIME", joinedAt: new Date() },
      });
      const before = await prisma.startup.findUnique({ where: { id: A.s.id } });
      const r = await call("PATCH", `/api/startups/${A.s.id}`, A.founder.token, {
        tagline: "updated",
        employees: { connect: [{ id: bEmployee.id }] },
        members: { connect: [{ id: B.employee.seatId }] },
        founderId: outsider.id,
        isVerified: !before.isVerified,
        isFeatured: true,
        code: "HACK",
      });
      assert.ok([200, 400].includes(r.status), `status ${r.status}`);
      const after = await prisma.startup.findUnique({ where: { id: A.s.id } });
      assert.equal((await prisma.employee.findUnique({ where: { id: bEmployee.id } })).startupId, B.s.id);
      assert.equal((await prisma.startupMember.findUnique({ where: { id: B.employee.seatId } })).startupId, B.s.id);
      assert.equal(after.founderId, before.founderId);
      assert.equal(after.isVerified, before.isVerified);
      assert.equal(after.isFeatured, before.isFeatured);
      assert.equal(after.code, before.code);
      if (r.status === 200) assert.equal(after.tagline, "updated", "legitimate fields still save");
    });

    test("editing a job cannot move it, or another startup's applications, across startups", async () => {
      const jobA = await prisma.job.create({ data: { startupId: A.s.id, title: "A job", description: "d", type: "FULL_TIME", domain: "x", location: "X" } });
      const jobB = await prisma.job.create({ data: { startupId: B.s.id, title: "B job", description: "d", type: "FULL_TIME", domain: "x", location: "X" } });
      const appB = await prisma.jobApplication.create({ data: { jobId: jobB.id, userId: B.intern.id, startupId: B.s.id } });

      const legacy = await call("PATCH", `/api/jobs/${jobA.id}`, A.founder.token, {
        title: "renamed", startupId: B.s.id, applications: { connect: [{ id: appB.id }] },
      });
      assert.equal(legacy.status, 200);
      const ws = await call("PATCH", `/api/w/${A.s.code}/jobs/${jobA.id}`, A.founder.token, {
        startupId: B.s.id, applications: { connect: [{ id: appB.id }] },
      });
      assert.ok([200, 400].includes(ws.status), `status ${ws.status}`);

      const job = await prisma.job.findUnique({ where: { id: jobA.id } });
      assert.equal(job.startupId, A.s.id);
      assert.equal(job.title, "renamed", "legitimate fields still save");
      assert.equal((await prisma.jobApplication.findUnique({ where: { id: appB.id } })).jobId, jobB.id);
    });
  });

  // ── Tenant workspace: body cannot redirect to another startup ──────────────
  describe("workspace calls stay inside the caller's startup", () => {
    test("scheduling an interview with startupId=B in the body cannot reach B's candidate", async () => {
      const jobB = await prisma.job.create({ data: { startupId: B.s.id, title: "B role", description: "d", type: "FULL_TIME", domain: "x", location: "X" } });
      const appB = await prisma.jobApplication.create({ data: { jobId: jobB.id, userId: outsider.id, startupId: B.s.id } });
      const r = await call("POST", `/api/w/${A.s.code}/applications/${appB.id}/interviews`, A.founder.token, {
        startupId: B.s.id, stage: "HR_ROUND", scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
      });
      assert.equal(r.status, 404);
      assert.equal(await prisma.interview.count({ where: { applicationId: appB.id } }), 0);
    });

    test("editing an interview cannot re-point it at another startup's application", async () => {
      const jobA = await prisma.job.create({ data: { startupId: A.s.id, title: "A role", description: "d", type: "FULL_TIME", domain: "x", location: "X" } });
      const appA = await prisma.jobApplication.create({ data: { jobId: jobA.id, userId: A.intern.id, startupId: A.s.id } });
      const jobB = await prisma.job.create({ data: { startupId: B.s.id, title: "B role 2", description: "d", type: "FULL_TIME", domain: "x", location: "X" } });
      const appB = await prisma.jobApplication.create({ data: { jobId: jobB.id, userId: B.intern.id, startupId: B.s.id } });
      const iv = await prisma.interview.create({
        data: { startupId: A.s.id, applicationId: appA.id, stage: "HR_ROUND", scheduledAt: new Date(Date.now() + 86_400_000), createdBy: A.founder.id },
      });
      await call("PATCH", `/api/w/${A.s.code}/interviews/${iv.id}`, A.founder.token, { applicationId: appB.id, startupId: B.s.id, location: "Room 1" });
      const after = await prisma.interview.findUnique({ where: { id: iv.id } });
      assert.equal(after.applicationId, appA.id);
      assert.equal(after.startupId, A.s.id);
      assert.equal(after.location, "Room 1", "legitimate fields still save");
    });

    test("editing a performance review cannot re-point it at another startup's employee", async () => {
      const mk = (sid: string) => prisma.employee.create({
        data: { startupId: sid, employeeCode: `E-${uniq()}`, fullName: "P", email: `p-${uniq()}@example.test`, designation: "Eng", employmentType: "FULL_TIME", joinedAt: new Date() },
      });
      const [eA, eB] = [await mk(A.s.id), await mk(B.s.id)];
      const review = await prisma.performanceReview.create({
        data: { startupId: A.s.id, employeeId: eA.id, reviewerId: A.founder.id, periodStart: new Date("2026-01-01"), periodEnd: new Date("2026-06-30"), rating: 3, status: "DRAFT" },
      });
      await call("PATCH", `/api/w/${A.s.code}/performance/${review.id}`, A.founder.token, { employeeId: eB.id, startupId: B.s.id, rating: 4 });
      const after = await prisma.performanceReview.findUnique({ where: { id: review.id } });
      assert.equal(after.employeeId, eA.id);
      assert.equal(after.startupId, A.s.id);
      assert.equal(after.rating, 4, "legitimate fields still save");
    });

    test("saving branding with startupId=B in the body brands A, never B (create and update)", async () => {
      const body = { startupId: B.s.id, legalName: "A Legal Pvt Ltd", signatoryName: "Founder A", signatoryTitle: "CEO" };
      // First save creates A's branding; the second updates it — the path where
      // the tenant client used to let `startupId` through.
      assert.equal((await call("PUT", `/api/w/${A.s.code}/branding`, A.founder.token, body)).status, 200);
      const second = await call("PUT", `/api/w/${A.s.code}/branding`, A.founder.token, { ...body, legalName: "A Legal Two" });
      assert.equal(second.status, 200);
      assert.equal(await prisma.startupBranding.count({ where: { startupId: B.s.id } }), 0);
      assert.equal((await prisma.startupBranding.findFirst({ where: { startupId: A.s.id } })).legalName, "A Legal Two");
    });
  });

  // ── Platform role escalation via the profile endpoint ──────────────────────
  describe("profile updates cannot reach the account", () => {
    test("a nested write through Profile.user cannot make anyone a platform admin", async () => {
      const r = await call("PATCH", `/api/users/${A.intern.id}`, A.intern.token, {
        bio: "hello", user: { update: { role: "ADMIN" } }, userId: B.intern.id,
      });
      assert.equal(r.status, 200);
      assert.equal((await prisma.user.findUnique({ where: { id: A.intern.id } })).role, "STUDENT");
      const profile = await prisma.profile.findUnique({ where: { userId: A.intern.id } });
      assert.equal(profile.bio, "hello");
      assert.equal(await prisma.profile.count({ where: { userId: B.intern.id } }), 0);
    });
  });
}
