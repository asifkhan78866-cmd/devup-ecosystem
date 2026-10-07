/**
 * Account-takeover regression tests: signup → email verification → claim, and
 * invitation acceptance.
 *
 * These run against a real Postgres, because the guarantees under test (one
 * owner per record, single-use tokens under concurrency) live in the database.
 * Set TEST_DATABASE_URL to a throwaway local database; it is wiped. Anything not
 * on localhost is refused. Supabase and email are in-memory stubs.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import Module from "node:module";
import path from "node:path";
import { execSync } from "node:child_process";
import { randomUUID, randomBytes, createHash } from "node:crypto";

const TEST_DB = process.env.TEST_DATABASE_URL;
const local = TEST_DB ? /^postgres(ql)?:\/\/[^@]*@(localhost|127\.0\.0\.1)(:\d+)?\//.test(TEST_DB) : false;

if (!TEST_DB || !local) {
  test("claims & invites (needs TEST_DATABASE_URL on localhost)", { skip: true }, () => {});
} else {
  run(TEST_DB);
}

function run(dbUrl: string) {
  const SRC = path.resolve(__dirname, "../src");
  process.env.DATABASE_URL = dbUrl;
  process.env.DIRECT_URL = dbUrl;
  process.env.NODE_ENV = "test";
  process.env.FRONTEND_URL = "https://app.example.test";
  process.env.REDIS_ENABLED = "false"; // never reach a real Redis from tests

  // ── Supabase stub: just enough Auth to tell who holds which password ──
  type AuthUser = { id: string; email: string; password: string; confirmed: boolean };
  const authUsers = new Map<string, AuthUser>();
  const sessions = new Map<string, string>(); // access token → user id
  const signOuts: Array<{ jwt: string; scope: string }> = [];
  let seq = 0;
  const byEmail = (email: string) => [...authUsers.values()].find((u) => u.email === email);
  const err = (status: number, code: string, message: string) => ({ status, code, message });

  // Access token → the auth user Supabase would return for it (OAuth sign-ins).
  const oauthTokens = new Map<string, any>();

  const supabaseAdmin = {
    auth: {
      getUser: async (token: string) => {
        const user = oauthTokens.get(token);
        return user ? { data: { user }, error: null } : { data: { user: null }, error: err(403, "bad_jwt", "invalid JWT") };
      },
      admin: {
        createUser: async ({ email, password, email_confirm }: any) => {
          if (byEmail(email)) return { data: { user: null }, error: err(422, "email_exists", "exists") };
          const id = randomUUID();
          authUsers.set(id, { id, email, password, confirmed: Boolean(email_confirm) });
          return { data: { user: { id, email } }, error: null };
        },
        updateUserById: async (id: string, attrs: any) => {
          const u = authUsers.get(id);
          if (!u) return { data: { user: null }, error: err(404, "user_not_found", "not found") };
          if (attrs.password) u.password = attrs.password;
          if (attrs.email_confirm) u.confirmed = true;
          return { data: { user: u }, error: null };
        },
        signOut: async (jwt: string, scope = "global") => {
          signOuts.push({ jwt, scope });
          const uid = sessions.get(jwt);
          for (const [t, owner] of sessions) {
            if (owner === uid && (scope === "global" || t !== jwt)) sessions.delete(t);
          }
          return { error: null };
        },
      },
    },
  };
  const createSessionClient = () => ({
    auth: {
      signInWithPassword: async ({ email, password }: any) => {
        const u = byEmail(email);
        if (!u || u.password !== password) {
          return { data: { session: null }, error: err(400, "invalid_credentials", "Invalid login credentials") };
        }
        // Mirrors the project setting mailer_autoconfirm=false.
        if (!u.confirmed) return { data: { session: null }, error: err(400, "email_not_confirmed", "Email not confirmed") };
        const token = `sess-${++seq}`;
        sessions.set(token, u.id);
        return { data: { session: { access_token: token, refresh_token: `r-${token}` }, user: { id: u.id } }, error: null };
      },
    },
  });

  // ── Email stub: captures what would have been sent ──
  const mails: Array<{ to: string; subject: string; html: string }> = [];
  const inviteMails: Array<{ to: string; inviteLink: string }> = [];

  function stub(rel: string, exports: unknown) {
    const file = require.resolve(path.join(SRC, rel));
    const m = new Module(file);
    m.filename = file;
    m.loaded = true;
    m.exports = exports;
    require.cache[file] = m;
  }
  stub("config/supabase", { supabaseAdmin, supabase: {}, createSessionClient, verifySupabaseAuthConfig: async () => true });
  stub("lib/resend", {
    MAIL_FROM: "DevUp <test@example.test>",
    resend: { emails: { send: async (p: any) => (mails.push(p), { data: {}, error: null }) } },
    sendTeamInviteEmail: async (p: any) => void inviteMails.push(p),
  });

  /* eslint-disable @typescript-eslint/no-var-requires */
  let prisma: any, AuthService: any, claims: any, members: any, tokens: any, redactUrl: any;
  let auth: any, offers: any, productionGaps: any, apiBase: string, server: any;

  const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
  const lastVerifyToken = (to: string) => {
    const mail = [...mails].reverse().find((m) => m.to === to && /verify-email#token=/.test(m.html));
    assert.ok(mail, `no verification email to ${to}`);
    return /verify-email#token=([A-Za-z0-9_-]+)/.exec(mail!.html)![1];
  };
  const lastInviteToken = (to: string) => {
    const mail = [...inviteMails].reverse().find((m) => m.to === to);
    assert.ok(mail, `no invite email to ${to}`);
    return /\/invite\/([A-Za-z0-9_-]+)/.exec(mail!.inviteLink)![1];
  };
  const email = (tag: string) => `${tag}-${randomBytes(4).toString("hex")}@example.test`;
  const rejectsWith = (p: Promise<unknown>, code: string) =>
    assert.rejects(p, (e: any) => {
      assert.equal(e.code, code);
      return true;
    });

  let founderId: string;
  async function seedStartup() {
    return prisma.startup.create({
      data: {
        name: "Acme", slug: `acme-${randomUUID()}`, tagline: "t", description: "d", domain: "AI_ML",
        stage: "IDEA", foundedYear: 2026, headcount: "1-5", location: "Remote", founderId,
      },
    });
  }
  /** What HR's direct hire leaves behind for someone who has no account yet. */
  async function hrHire(startupId: string, to: string) {
    const employee = await prisma.employee.create({
      data: {
        startupId, employeeCode: `E-${randomUUID()}`, fullName: "New Hire", email: to,
        designation: "Engineer", employmentType: "FULL_TIME", joinedAt: new Date(),
      },
    });
    const member = await prisma.startupMember.create({
      data: { startupId, email: to, role: "EMPLOYEE", status: "INVITED", invitedBy: founderId, inviteToken: sha256(randomUUID()) },
    });
    return { employee, member };
  }
  async function verifiedUser(to: string) {
    return prisma.user.create({ data: { id: randomUUID(), email: to, emailVerifiedAt: new Date() } });
  }
  async function signupAndVerify(to: string, password = "victim-password-1") {
    await auth.register({ email: to, password: "registrant-pass-1" });
    await auth.verifyEmail(lastVerifyToken(to), password);
    return prisma.user.findFirst({ where: { email: to } });
  }

  before(() => {
    execSync("npx prisma db push --force-reset --skip-generate --accept-data-loss", {
      cwd: path.resolve(__dirname, ".."),
      env: { ...process.env, DATABASE_URL: dbUrl, DIRECT_URL: dbUrl },
      stdio: "ignore",
    });
    prisma = require(path.join(SRC, "lib/prisma")).prisma;
    AuthService = require(path.join(SRC, "modules/auth/auth.service")).AuthService;
    claims = require(path.join(SRC, "modules/shared/claim.service"));
    members = require(path.join(SRC, "modules/startups/members.service"));
    tokens = require(path.join(SRC, "lib/tokens"));
    redactUrl = require(path.join(SRC, "middleware/logger")).redactUrl;
    offers = require(path.join(SRC, "modules/recruiting/offers/offers.service"));
    productionGaps = require(path.join(SRC, "config/env")).productionGaps;
    auth = new AuthService();
  });
  before(async () => {
    const { app } = require(path.join(SRC, "app"));
    server = app.listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    apiBase = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => server?.close());
  before(async () => {
    founderId = (await prisma.user.create({ data: { id: randomUUID(), email: email("founder"), emailVerifiedAt: new Date() } })).id;
  });
  after(async () => prisma?.$disconnect());

  // 1 ────────────────────────────────────────────────────────────────────────
  describe("1. unverified signup cannot claim", () => {
    test("signing up with a new hire's address attaches nothing", async () => {
      const startup = await seedStartup();
      const victim = email("victim");
      const { employee, member } = await hrHire(startup.id, victim);

      const res = await auth.register({ email: victim, password: "attacker-pass-1" });
      assert.equal(res.verificationRequired, true);

      const squatter = await prisma.user.findFirst({ where: { email: victim } });
      assert.equal(squatter.emailVerifiedAt, null);
      assert.equal(authUsers.get(squatter.id)!.confirmed, false, "auth account created unconfirmed");

      assert.equal((await prisma.employee.findUnique({ where: { id: employee.id } })).userId, null);
      assert.equal((await prisma.startupMember.findUnique({ where: { id: member.id } })).userId, null);

      const claim = await claims.claimByEmail(squatter.id);
      assert.equal(claim.claimed, false);
      assert.equal(claim.reason, "unverified");
      assert.equal(await claims.claimIfEmpty(squatter.id, false), false);
      assert.equal(await claims.findVerifiedUserIdByEmail(victim), null, "HR linking ignores unverified accounts");
      assert.equal((await prisma.employee.findUnique({ where: { id: employee.id } })).userId, null);
    });

    test("an unconfirmed account cannot sign in", async () => {
      const to = email("unconfirmed");
      await auth.register({ email: to, password: "registrant-pass-1" });
      const { error } = await createSessionClient().auth.signInWithPassword({ email: to, password: "registrant-pass-1" });
      assert.equal(error?.code, "email_not_confirmed");
    });

    test("signup gives the same answer for new, unverified and verified addresses", async () => {
      const fresh = await auth.register({ email: email("fresh"), password: "registrant-pass-1" });
      const verified = await verifiedUser(email("known"));
      const again = await auth.register({ email: verified.email, password: "registrant-pass-1" });
      assert.deepEqual(again, fresh);
      assert.ok(mails.some((m) => m.to === verified.email && /already have a DevUp account/.test(m.subject)));
    });

    test("resend never reveals whether an address exists", async () => {
      const before = mails.length;
      await auth.resendVerification(email("nobody"));
      assert.equal(mails.length, before, "no mail for unknown address, and no error");
    });
  });

  // 2 ────────────────────────────────────────────────────────────────────────
  describe("2. verified legitimate user can claim", () => {
    test("following the link claims the records and activates the seat", async () => {
      const startup = await seedStartup();
      const owner = email("owner");
      const { employee, member } = await hrHire(startup.id, owner);

      const user = await signupAndVerify(owner);
      assert.ok(user.emailVerifiedAt);
      assert.equal((await prisma.employee.findUnique({ where: { id: employee.id } })).userId, user.id);
      const seat = await prisma.startupMember.findUnique({ where: { id: member.id } });
      assert.equal(seat.userId, user.id);
      assert.equal(seat.status, "ACTIVE");
    });

    test("the inbox owner's password replaces the registrant's, and every session is revoked", async () => {
      const victim = email("prehijack");
      await auth.register({ email: victim, password: "attacker-pass-1" });
      const id = (await prisma.user.findFirst({ where: { email: victim } })).id;
      authUsers.get(id)!.confirmed = true; // even if confirmation were off and they held a session…
      const squatterSession = (await createSessionClient().auth.signInWithPassword({ email: victim, password: "attacker-pass-1" })).data.session!.access_token;
      authUsers.get(id)!.confirmed = false;

      await auth.verifyEmail(lastVerifyToken(victim), "owner-chosen-pass");

      assert.equal(authUsers.get(id)!.password, "owner-chosen-pass");
      assert.equal(sessions.has(squatterSession), false, "squatter's session revoked");
      assert.ok(signOuts.some((s) => s.scope === "global"));
      const { error } = await createSessionClient().auth.signInWithPassword({ email: victim, password: "attacker-pass-1" });
      assert.equal(error?.code, "invalid_credentials");
    });

    test("only a hash of the verification token is stored", async () => {
      const to = email("hash");
      await auth.register({ email: to, password: "registrant-pass-1" });
      const raw = lastVerifyToken(to);
      const row = await prisma.emailVerification.findFirst({ where: { email: to }, orderBy: { createdAt: "desc" } });
      assert.notEqual(row.tokenHash, raw);
      assert.equal(row.tokenHash, sha256(raw));
      assert.equal(tokens.hashToken(raw), row.tokenHash);
    });

    test("an expired verification link is rejected", async () => {
      const to = email("expired-link");
      await auth.register({ email: to, password: "registrant-pass-1" });
      const raw = lastVerifyToken(to);
      await prisma.emailVerification.update({ where: { tokenHash: sha256(raw) }, data: { expiresAt: new Date(Date.now() - 1000) } });
      const id = (await prisma.user.findFirst({ where: { email: to } })).id;
      const signOutsBefore = signOuts.length;

      await rejectsWith(auth.verifyEmail(raw, "new-password-1"), "INVALID_VERIFICATION_LINK");

      // Rejected before anything happens: no password change, no confirmation.
      assert.equal(authUsers.get(id)!.password, "registrant-pass-1");
      assert.equal(authUsers.get(id)!.confirmed, false);
      assert.equal(signOuts.length, signOutsBefore);
      assert.equal((await prisma.user.findUnique({ where: { id } })).emailVerifiedAt, null);
    });

    test("a used verification link cannot be replayed, and a newer link retires older ones", async () => {
      const to = email("replay");
      await auth.register({ email: to, password: "registrant-pass-1" });
      const first = lastVerifyToken(to);
      await auth.resendVerification(to);
      const second = lastVerifyToken(to);
      assert.notEqual(first, second);
      await rejectsWith(auth.verifyEmail(first, "new-password-1"), "INVALID_VERIFICATION_LINK");
      await auth.verifyEmail(second, "new-password-1");
      await rejectsWith(auth.verifyEmail(second, "new-password-2"), "INVALID_VERIFICATION_LINK");
    });
  });

  // 3 ────────────────────────────────────────────────────────────────────────
  describe("3. wrong user cannot claim", () => {
    test("a verified account with a different email gets nothing", async () => {
      const startup = await seedStartup();
      const { employee } = await hrHire(startup.id, email("target"));
      const other = await verifiedUser(email("other"));
      const claim = await claims.claimByEmail(other.id);
      assert.equal(claim.claimed, false);
      assert.equal((await prisma.employee.findUnique({ where: { id: employee.id } })).userId, null);
    });

    test("an address two accounts answer to (case variants) is claimed by neither", async () => {
      const startup = await seedStartup();
      const base = email("twins");
      const { employee } = await hrHire(startup.id, base);
      const lower = await verifiedUser(base);
      const upper = await verifiedUser(base.toUpperCase());
      for (const u of [lower, upper]) assert.equal((await claims.claimByEmail(u.id)).reason, "ambiguous");
      assert.equal(await claims.findVerifiedUserIdByEmail(base), null);
      assert.equal((await prisma.employee.findUnique({ where: { id: employee.id } })).userId, null);
    });

    test("a record already owned is never re-claimed", async () => {
      const startup = await seedStartup();
      const to = email("owned");
      const { employee } = await hrHire(startup.id, to);
      const keeper = await verifiedUser(email("keeper"));
      await prisma.employee.update({ where: { id: employee.id }, data: { userId: keeper.id } });
      const claimant = await verifiedUser(to);
      await claims.claimByEmail(claimant.id);
      assert.equal((await prisma.employee.findUnique({ where: { id: employee.id } })).userId, keeper.id);
    });
  });

  // 4 ────────────────────────────────────────────────────────────────────────
  describe("4. an invitation for A cannot be used by B", () => {
    test("B, signed in and verified, is refused; the invite stays open for A", async () => {
      const startup = await seedStartup();
      const a = email("invitee-a");
      await members.adminInviteFounder({ startupId: startup.id, email: a, invitedBy: founderId });
      const token = lastInviteToken(a);
      const b = await verifiedUser(email("intruder-b"));

      await rejectsWith(members.acceptInvite(token, b.id), "INVITE_EMAIL_MISMATCH");
      const row = await prisma.startupMember.findFirst({ where: { startupId: startup.id, email: a } });
      assert.equal(row.status, "INVITED");
      assert.equal(row.userId, null);
    });

    test("an unverified account holding A's address is refused too", async () => {
      const startup = await seedStartup();
      const a = email("invitee-unverified");
      await members.adminInviteFounder({ startupId: startup.id, email: a, invitedBy: founderId });
      const squatter = await prisma.user.create({ data: { id: randomUUID(), email: a } });
      await rejectsWith(members.acceptInvite(lastInviteToken(a), squatter.id), "EMAIL_NOT_VERIFIED");
    });

    test("A, verified, can accept — address match ignores case", async () => {
      const startup = await seedStartup();
      const a = email("invitee-ok");
      await members.adminInviteFounder({ startupId: startup.id, email: a, invitedBy: founderId });
      const user = await verifiedUser(a.toUpperCase());
      const seat = await members.acceptInvite(lastInviteToken(a), user.id);
      assert.equal(seat.userId, user.id);
      assert.equal(seat.status, "ACTIVE");
    });

    test("only a hash of the invite token is stored", async () => {
      const startup = await seedStartup();
      const a = email("invite-hash");
      await members.adminInviteFounder({ startupId: startup.id, email: a, invitedBy: founderId });
      const raw = lastInviteToken(a);
      const row = await prisma.startupMember.findFirst({ where: { startupId: startup.id, email: a } });
      assert.equal(row.inviteToken, sha256(raw));
    });

    test("registering through an employee invite does not make the invitee an owner", async () => {
      const startup = await seedStartup();
      const inviter = await prisma.startupMember.create({
        data: { startupId: startup.id, userId: founderId, email: `owner-${startup.id}@example.test`, role: "FOUNDER", status: "ACTIVE", invitedBy: founderId, inviteToken: sha256(randomUUID()) },
      });
      assert.ok(inviter);
      const intern = email("intern");
      await members.inviteMember({ startupId: startup.id, invitedBy: founderId, email: intern, role: "INTERN" });
      await members.registerAndAccept({ token: lastInviteToken(intern), password: "intern-pass-1" });
      const seat = await prisma.startupMember.findFirst({ where: { startupId: startup.id, email: intern } });
      const user = await prisma.user.findFirst({ where: { email: intern } });
      assert.equal(seat.role, "INTERN");
      assert.equal(user.role, "STUDENT");
      assert.ok(user.emailVerifiedAt, "the invite link proved the inbox");
    });
  });

  // 5 ────────────────────────────────────────────────────────────────────────
  describe("5. expired invite rejected", () => {
    test("on lookup, signed-in acceptance and new-account acceptance", async () => {
      const startup = await seedStartup();
      const a = email("stale");
      await members.adminInviteFounder({ startupId: startup.id, email: a, invitedBy: founderId });
      const token = lastInviteToken(a);
      await prisma.startupMember.updateMany({
        where: { startupId: startup.id, email: a },
        data: { invitedAt: new Date(Date.now() - (members.INVITE_TTL_DAYS + 1) * 86_400_000) },
      });
      const user = await verifiedUser(a);
      await rejectsWith(members.getInviteByToken(token), "INVITE_INVALID");
      await rejectsWith(members.acceptInvite(token, user.id), "INVITE_INVALID");
      await prisma.user.delete({ where: { id: user.id } });
      await rejectsWith(members.registerAndAccept({ token, password: "pass-123456" }), "INVITE_INVALID");
    });
  });

  // 6 ────────────────────────────────────────────────────────────────────────
  describe("6. reused invite rejected", () => {
    test("a used link finds nothing, and the stored hash has rotated", async () => {
      const startup = await seedStartup();
      const a = email("once");
      await members.adminInviteFounder({ startupId: startup.id, email: a, invitedBy: founderId });
      const token = lastInviteToken(a);
      const user = await verifiedUser(a);
      await members.acceptInvite(token, user.id);

      await rejectsWith(members.acceptInvite(token, user.id), "INVITE_INVALID");
      await rejectsWith(members.getInviteByToken(token), "INVITE_INVALID");
      await rejectsWith(members.registerAndAccept({ token, password: "pass-123456" }), "INVITE_INVALID");
      const row = await prisma.startupMember.findFirst({ where: { startupId: startup.id, email: a } });
      assert.notEqual(row.inviteToken, sha256(token));
    });
  });

  // 7 ────────────────────────────────────────────────────────────────────────
  describe("7. concurrent claims cannot duplicate ownership", () => {
    test("25 simultaneous claims by the owner: one owner, one seat, no errors", async () => {
      const startup = await seedStartup();
      const to = email("burst");
      const { employee } = await hrHire(startup.id, to);
      const user = await verifiedUser(to);
      const results = await Promise.all(Array.from({ length: 25 }, () => claims.claimByEmail(user.id)));
      assert.equal(results.filter((r: any) => r.employees === 1).length, 1, "exactly one call won the row");
      assert.equal((await prisma.employee.findUnique({ where: { id: employee.id } })).userId, user.id);
      assert.equal(await prisma.startupMember.count({ where: { startupId: startup.id, userId: user.id } }), 1);
    });

    test("two accounts racing for one address: neither wins", async () => {
      const startup = await seedStartup();
      const base = email("race");
      const { employee } = await hrHire(startup.id, base);
      const [x, y] = [await verifiedUser(base), await verifiedUser(base.toUpperCase())];
      await Promise.all([...Array(10)].flatMap(() => [claims.claimByEmail(x.id), claims.claimByEmail(y.id)]));
      assert.equal((await prisma.employee.findUnique({ where: { id: employee.id } })).userId, null);
    });

    test("one invite accepted 10 times at once: exactly one acceptance", async () => {
      const startup = await seedStartup();
      const a = email("stampede");
      await members.adminInviteFounder({ startupId: startup.id, email: a, invitedBy: founderId });
      const token = lastInviteToken(a);
      const user = await verifiedUser(a);
      const outcomes = await Promise.allSettled(Array.from({ length: 10 }, () => members.acceptInvite(token, user.id)));
      assert.equal(outcomes.filter((o) => o.status === "fulfilled").length, 1);
      assert.ok(outcomes.filter((o) => o.status === "rejected").every((o: any) => o.reason.code === "INVITE_INVALID"));
    });

    test("one verification link submitted 5 times at once: exactly one success", async () => {
      const to = email("double-click");
      await auth.register({ email: to, password: "registrant-pass-1" });
      const token = lastVerifyToken(to);
      const outcomes = await Promise.allSettled(Array.from({ length: 5 }, () => auth.verifyEmail(token, "owner-pass-12")));
      assert.equal(outcomes.filter((o) => o.status === "fulfilled").length, 1);
    });
  });

  // Google / OAuth ───────────────────────────────────────────────────────────
  describe("Google sign-in", () => {
    /** An auth account as Supabase would return it after an OAuth sign-in. */
    function googleSession(opts: { id?: string; email: string; googleVerified: boolean; withPassword?: boolean }) {
      const id = opts.id ?? randomUUID();
      const identities: any[] = [
        { provider: "google", identity_data: { email: opts.email, email_verified: opts.googleVerified } },
      ];
      if (opts.withPassword) identities.push({ provider: "email", identity_data: { email: opts.email, email_verified: false } });
      const token = `google-${++seq}`;
      sessions.set(token, id);
      oauthTokens.set(token, { id, email: opts.email, identities, user_metadata: { full_name: "Real Owner" } });
      return { id, token };
    }

    test("a Google-verified new user is verified and claims their records", async () => {
      const startup = await seedStartup();
      const to = email("google-new");
      const { employee } = await hrHire(startup.id, to);
      const { id, token } = googleSession({ email: to, googleVerified: true });

      const user = await auth.syncGoogleUser(token);
      assert.equal(user.id, id);
      assert.ok(user.emailVerifiedAt);
      assert.equal((await prisma.employee.findUnique({ where: { id: employee.id } })).userId, id);
      assert.ok(sessions.has(token), "the Google session itself stays signed in");
    });

    test("an identity Google has not verified claims nothing", async () => {
      const startup = await seedStartup();
      const to = email("google-unverified");
      const { employee } = await hrHire(startup.id, to);
      const { token } = googleSession({ email: to, googleVerified: false });

      const user = await auth.syncGoogleUser(token);
      assert.equal(user.emailVerifiedAt, null);
      assert.equal((await prisma.employee.findUnique({ where: { id: employee.id } })).userId, null);
    });

    test("a squatter's password and sessions die when the real owner signs in with Google", async () => {
      const startup = await seedStartup();
      const victim = email("google-squat");
      const { employee } = await hrHire(startup.id, victim);

      // The squatter registered first; Supabase later links the owner's Google identity to that account.
      await auth.register({ email: victim, password: "squatter-pass-1" });
      const id = (await prisma.user.findFirst({ where: { email: victim } })).id;
      authUsers.get(id)!.confirmed = true;
      const squatterSession = (await createSessionClient().auth.signInWithPassword({ email: victim, password: "squatter-pass-1" })).data.session!.access_token;
      const { token } = googleSession({ id, email: victim, googleVerified: true, withPassword: true });

      const user = await auth.syncGoogleUser(token);
      assert.ok(user.emailVerifiedAt);
      assert.notEqual(authUsers.get(id)!.password, "squatter-pass-1", "squatter's password replaced");
      assert.equal(sessions.has(squatterSession), false, "squatter's session revoked");
      assert.ok(sessions.has(token), "owner's Google session kept");
      assert.equal((await prisma.employee.findUnique({ where: { id: employee.id } })).userId, id);
    });

    test("a profile row owned by a different auth account is neither verified nor used to claim", async () => {
      const startup = await seedStartup();
      const to = email("google-mismatch");
      const { employee } = await hrHire(startup.id, to);
      const other = await prisma.user.create({ data: { id: randomUUID(), email: to } });
      const { token } = googleSession({ email: to, googleVerified: true });
      const signOutsBefore = signOuts.length;

      await auth.syncGoogleUser(token);
      assert.equal(signOuts.length, signOutsBefore, "no account-security actions taken on someone else's row");
      assert.equal((await prisma.user.findUnique({ where: { id: other.id } })).emailVerifiedAt, null);
      assert.equal((await prisma.employee.findUnique({ where: { id: employee.id } })).userId, null);
    });

    test("a returning Google-only user keeps working and is not reset", async () => {
      const to = email("google-returning");
      const { id, token } = googleSession({ email: to, googleVerified: true });
      await auth.syncGoogleUser(token);
      const again = googleSession({ id, email: to, googleVerified: true });
      const user = await auth.syncGoogleUser(again.token);
      assert.equal(user.id, id);
      assert.ok(user.emailVerifiedAt);
      assert.equal(authUsers.has(id), false, "no password was ever set or reset");
    });
  });

  // Recruiting hand-off ─────────────────────────────────────────────────────
  describe("hiring cannot claim someone else's records through a typed email", () => {
    async function acceptedApplication(startupId: string, candidateId: string, applicantEmail: string) {
      const job = await prisma.job.create({
        data: { startupId, title: "Engineer", description: "d", type: "FULL_TIME", domain: "AI", location: "Remote" },
      });
      const app = await prisma.jobApplication.create({
        data: { jobId: job.id, userId: candidateId, startupId, applicantEmail, applicantName: "Candidate" },
      });
      await prisma.offerLetter.create({
        data: {
          startupId, applicationId: app.id, offerNo: `OFF-${randomUUID()}`, designation: "Engineer",
          employmentType: "FULL_TIME", joiningDate: new Date(), expiresAt: new Date(Date.now() + 86_400_000),
          createdBy: founderId, status: "ACCEPTED",
        },
      });
      return app;
    }
    const code = () => randomBytes(2).toString("hex").toUpperCase().slice(0, 3);

    test("a candidate who typed the founder's email cannot take the founder's seat", async () => {
      const startup = await prisma.startup.update({ where: { id: (await seedStartup()).id }, data: { code: code() } });
      const founderEmail = email("founder-seat");
      const founderSeat = await prisma.startupMember.create({
        data: { startupId: startup.id, userId: founderId, email: founderEmail, role: "FOUNDER", status: "ACTIVE", invitedBy: founderId, inviteToken: sha256(randomUUID()) },
      });
      const candidate = await verifiedUser(email("candidate"));
      const app = await acceptedApplication(startup.id, candidate.id, founderEmail);

      await rejectsWith(
        offers.onboard({ startupId: startup.id, startupCode: startup.code, applicationId: app.id, actorId: founderId }),
        "EMAIL_CONFLICT"
      );
      const seat = await prisma.startupMember.findUnique({ where: { id: founderSeat.id } });
      assert.equal(seat.userId, founderId);
      assert.equal(seat.role, "FOUNDER");
    });

    test("a candidate who typed a former employee's email cannot take over their employee record", async () => {
      const startup = await prisma.startup.update({ where: { id: (await seedStartup()).id }, data: { code: code() } });
      const formerEmail = email("former");
      const former = await verifiedUser(formerEmail);
      const prior = await prisma.employee.create({
        data: {
          startupId: startup.id, employeeCode: `E-${randomUUID()}`, userId: former.id, fullName: "Former",
          email: formerEmail, designation: "Engineer", employmentType: "FULL_TIME", joinedAt: new Date(), status: "EXITED",
        },
      });
      const candidate = await verifiedUser(email("rehire-attempt"));
      const app = await acceptedApplication(startup.id, candidate.id, formerEmail);

      await rejectsWith(
        offers.onboard({ startupId: startup.id, startupCode: startup.code, applicationId: app.id, actorId: founderId }),
        "EMAIL_CONFLICT"
      );
      const record = await prisma.employee.findUnique({ where: { id: prior.id } });
      assert.equal(record.userId, former.id);
      assert.equal(record.status, "EXITED");
    });

    test("a candidate's own verified address still onboards and picks up their parked seat", async () => {
      const startup = await prisma.startup.update({ where: { id: (await seedStartup()).id }, data: { code: code() } });
      const to = email("hire");
      const parked = await prisma.startupMember.create({
        data: { startupId: startup.id, email: to, role: "EMPLOYEE", status: "INVITED", invitedBy: founderId, inviteToken: sha256(randomUUID()) },
      });
      const candidate = await verifiedUser(to);
      const app = await acceptedApplication(startup.id, candidate.id, to);

      const record = await offers.onboard({ startupId: startup.id, startupCode: startup.code, applicationId: app.id, actorId: founderId });
      assert.equal(record.userId, candidate.id);
      const seat = await prisma.startupMember.findUnique({ where: { id: parked.id } });
      assert.equal(seat.userId, candidate.id);
      assert.equal(seat.status, "ACTIVE");
    });
  });

  describe("invitation roles are server-controlled", () => {
    test("a signed-in employee invitee stays an employee; platform role unchanged", async () => {
      const startup = await seedStartup();
      await prisma.startupMember.create({
        data: { startupId: startup.id, userId: founderId, email: `owner2-${startup.id}@example.test`, role: "FOUNDER", status: "ACTIVE", invitedBy: founderId, inviteToken: sha256(randomUUID()) },
      });
      const to = email("employee-invite");
      await members.inviteMember({ startupId: startup.id, invitedBy: founderId, email: to, role: "EMPLOYEE" });
      const user = await verifiedUser(to);
      const seat = await members.acceptInvite(lastInviteToken(to), user.id);
      assert.equal(seat.role, "EMPLOYEE");
      assert.equal(seat.startupId, startup.id);
      assert.equal((await prisma.user.findUnique({ where: { id: user.id } })).role, "STUDENT");
    });
  });

  describe("verification email abuse and configuration", () => {
    test("resend is capped at five links an hour per account", async () => {
      const to = email("flood");
      await auth.register({ email: to, password: "registrant-pass-1" });
      for (let i = 0; i < 10; i++) await auth.resendVerification(to);
      assert.equal(mails.filter((m) => m.to === to).length, 5);
    });

    test("production without a mail provider refuses signup instead of promising an email", async () => {
      productionGaps.emailDisabled = true;
      try {
        await rejectsWith(auth.register({ email: email("nomail"), password: "registrant-pass-1" }), "EMAIL_DELIVERY_UNCONFIGURED");
        await rejectsWith(auth.resendVerification(email("nomail")), "EMAIL_DELIVERY_UNCONFIGURED");
      } finally {
        productionGaps.emailDisabled = false;
      }
    });
  });

  describe("HTTP endpoints", () => {
    const post = (p: string, body: unknown) =>
      fetch(`${apiBase}${p}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    test("signup and resend answer identically for known and unknown addresses", async () => {
      const known = await verifiedUser(email("http-known"));
      const [a, b] = await Promise.all([
        post("/api/auth/register", { email: known.email, password: "registrant-pass-1" }),
        post("/api/auth/register", { email: email("http-new"), password: "registrant-pass-1" }),
      ]);
      assert.equal(a.status, 202);
      assert.equal(b.status, 202);
      assert.deepEqual(await a.json(), await b.json());

      const [c, d] = await Promise.all([
        post("/api/auth/resend-verification", { email: known.email }),
        post("/api/auth/resend-verification", { email: email("http-nobody") }),
      ]);
      assert.equal(c.status, 202);
      assert.deepEqual(await c.json(), await d.json());
    });

    test("verify-email rejects a bad token with the neutral error, and validates input", async () => {
      const bad = await post("/api/auth/verify-email", { token: "x".repeat(43), password: "new-password-1" });
      assert.equal(bad.status, 400);
      assert.equal((await bad.json()).code, "INVALID_VERIFICATION_LINK");
      const missing = await post("/api/auth/verify-email", { token: "x".repeat(43) });
      assert.equal(missing.status, 400);
    });

    test("extra fields in the body change nothing (no mass assignment)", async () => {
      const to = email("http-mass");
      const res = await post("/api/auth/register", {
        email: to, password: "registrant-pass-1", role: "ADMIN", emailVerifiedAt: new Date().toISOString(), id: randomUUID(),
      });
      assert.equal(res.status, 400, "role outside the allowed set is rejected by validation");
      const res2 = await post("/api/auth/register", {
        email: to, password: "registrant-pass-1", emailVerifiedAt: new Date().toISOString(),
      });
      assert.equal(res2.status, 202);
      const user = await prisma.user.findFirst({ where: { email: to } });
      assert.equal(user.emailVerifiedAt, null);
      assert.equal(user.role, "STUDENT");
    });
  });

  describe("tokens never reach the logs", () => {
    test("request URLs are logged with tokens cut out", () => {
      assert.equal(redactUrl("/api/startups/invites/abcDEF123/accept"), "/api/startups/invites/[redacted]/accept");
      assert.equal(redactUrl("/api/kyc/sometoken/upload"), "/api/kyc/[redacted]/upload");
      assert.equal(redactUrl("/x?token=abc&y=1"), "/x?token=[redacted]&y=1");
    });
  });
}
