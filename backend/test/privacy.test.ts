/**
 * Private user data: who may read an account, and what the public sees of a
 * person. Runs over HTTP against a real Postgres (see test/support/harness.ts).
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { startHarness, testDatabaseUrl, Person } from "./support/harness";

const PRIVATE_PROFILE = { phone: "+91-9000000000", cgpa: 9.1, degree: "B.Tech", graduationYear: 2027, resumeUrl: "https://x.test/r.pdf" };
const PRIVATE_KEYS = ["email", "role", "passwordHash", "lastLoginAt", "emailVerifiedAt", "phone", "cgpa", "degree", "branch", "graduationYear", "resumeUrl", "resumeFileName", "experienceYears"];

/** Every private key anywhere in a value, with its path. */
function privateKeysIn(value: unknown, at = "$"): string[] {
  if (!value || typeof value !== "object") return [];
  const found: string[] = [];
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (PRIVATE_KEYS.includes(k)) found.push(`${at}.${k}`);
    found.push(...privateKeysIn(v, `${at}.${k}`));
  }
  return found;
}

const DB = testDatabaseUrl();
if (!DB) {
  test("private user data (needs TEST_DATABASE_URL on localhost)", { skip: true }, () => {});
} else {
  describe("private user data", () => {
    let h: Awaited<ReturnType<typeof startHarness>>;
    let alice: Person, bob: Person, staff: Person, superStaff: Person, founder: Person;
    let startupId: string, slug: string;

    before(async () => {
      h = await startHarness(DB);
      alice = await h.person("alice", "STUDENT", PRIVATE_PROFILE);
      bob = await h.person("bob", "STUDENT", PRIVATE_PROFILE);
      staff = await h.person("staff", "ADMIN");
      superStaff = await h.person("super", "SUPER_ADMIN");
      founder = await h.person("founder", "FOUNDER", { ...PRIVATE_PROFILE, bio: "Building things", linkedinUrl: "https://linkedin.test/f" });
      const s = await h.startup(founder);
      startupId = s.id;
      slug = s.slug;
      await h.prisma.cofounderProfile.create({
        data: { userId: alice.id, role: "DEVELOPER", stage: "IDEA", seeking: ["DESIGNER"], availability: "FULL_TIME" },
      });
    });
    after(async () => h?.close());

    describe("the user list", () => {
      test("anonymous callers are refused", async () => {
        assert.equal((await h.call("GET", "/api/users")).status, 401);
      });
      test("ordinary users are refused", async () => {
        assert.equal((await h.call("GET", "/api/users", alice.token)).status, 403);
      });
      test("ADMIN and SUPER_ADMIN may list, without credential columns, and the limit is bounded", async () => {
        // Enough accounts that an uncapped limit would visibly return more than the cap.
        await h.prisma.user.createMany({
          data: Array.from({ length: 205 }, (_, i) => ({ id: randomUUID(), email: `bulk-${i}-${h.uniq()}@example.test` })),
        });
        for (const who of [staff, superStaff]) {
          const r = await h.call("GET", "/api/users?limit=100000", who.token);
          assert.equal(r.status, 200, `${who.role}`);
          assert.ok(r.body.data.length <= 200);
          assert.ok(r.body.data.every((u: any) => !("passwordHash" in u)));
        }
      });
    });

    describe("a single account", () => {
      test("anonymous callers are refused", async () => {
        assert.equal((await h.call("GET", `/api/users/${alice.id}`)).status, 401);
      });
      test("another user gets the same 404 as for an account that does not exist", async () => {
        const other = await h.call("GET", `/api/users/${alice.id}`, bob.token);
        const ghost = await h.call("GET", `/api/users/${randomUUID()}`, bob.token);
        assert.equal(other.status, 404);
        assert.deepEqual(other.body, ghost.body);
      });
      test("the owner reads their own record, without credential columns", async () => {
        const r = await h.call("GET", `/api/users/${alice.id}`, alice.token);
        assert.equal(r.status, 200);
        assert.equal(r.body.data.email, alice.email);
        assert.equal(r.body.data.profile.phone, PRIVATE_PROFILE.phone);
        assert.ok(!("passwordHash" in r.body.data));
      });
      test("DevUp staff may read any record", async () => {
        assert.equal((await h.call("GET", `/api/users/${alice.id}`, staff.token)).status, 200);
      });
      test("sign-in never returns credential columns", async () => {
        await h.prisma.user.update({ where: { id: alice.id }, data: { passwordHash: "legacy-hash-value" } });
        const r = await h.call("POST", "/api/auth/login", undefined, { email: alice.email, password: `pw-${alice.id}` });
        assert.equal(r.status, 200);
        assert.equal(r.body.data.user.id, alice.id);
        assert.ok(!("passwordHash" in r.body.data.user));
        assert.ok(!JSON.stringify(r.body).includes("legacy-hash-value"));
      });
      test("/api/auth/me never carries credential columns", async () => {
        const r = await h.call("GET", "/api/auth/me", alice.token);
        assert.equal(r.status, 200);
        assert.ok(!("passwordHash" in r.body.data));
      });
    });

    describe("activity", () => {
      test("another user cannot see someone's applications and memberships", async () => {
        assert.equal((await h.call("GET", `/api/users/${alice.id}/activity`, bob.token)).status, 404);
      });
      test("the owner and DevUp staff can", async () => {
        assert.equal((await h.call("GET", `/api/users/${alice.id}/activity`, alice.token)).status, 200);
        assert.equal((await h.call("GET", `/api/users/${alice.id}/activity`, staff.token)).status, 200);
      });
    });

    describe("what the public sees of a person", () => {
      test("a startup page shows founders' public profile only", async () => {
        const r = await h.call("GET", `/api/startups/${slug}`);
        assert.equal(r.status, 200);
        const founders = r.body.data.founders;
        assert.equal(founders.length, 1);
        assert.equal(founders[0].id, founder.id);
        assert.equal(founders[0].profile.name, "founder person");
        assert.equal(founders[0].profile.bio, "Building things");
        assert.equal(founders[0].profile.linkedinUrl, "https://linkedin.test/f");
        assert.deepEqual(privateKeysIn(founders), []);
      });
      test("the startup list does not expose founders' email", async () => {
        const r = await h.call("GET", "/api/startups?limit=50");
        assert.equal(r.status, 200);
        const mine = r.body.data.find((s: any) => s.id === startupId);
        assert.ok(mine, "startup is listed");
        assert.deepEqual(privateKeysIn(mine.primaryFounder), []);
      });
      test("the co-founder directory shows public profiles only", async () => {
        const r = await h.call("GET", "/api/cofounders");
        assert.equal(r.status, 200);
        assert.deepEqual(privateKeysIn(r.body.data.map((p: any) => p.user)), []);
      });
      test("sending a co-founder request does not reveal the recipient's private details", async () => {
        const sent = await h.call("POST", `/api/cofounders/${alice.id}/request`, bob.token, { message: "Let us build something together" });
        assert.ok([200, 201].includes(sent.status), `send status ${sent.status}`);
        const r = await h.call("GET", "/api/cofounders/requests", bob.token);
        assert.equal(r.status, 200);
        assert.deepEqual(privateKeysIn(r.body.data), []);
      });
    });
  });
}
