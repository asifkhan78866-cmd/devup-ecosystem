/**
 * Hackathon registrations: a team's registration is reachable only with its
 * private token — not by id, not by phone number. Real Postgres via the harness.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { startHarness, testDatabaseUrl, Person } from "./support/harness";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
let phoneSeq = 6000000000;
const nextPhone = () => String(++phoneSeq);

const DB = testDatabaseUrl();
if (!DB) {
  test("hackathon lead access (needs TEST_DATABASE_URL on localhost)", { skip: true }, () => {});
} else {
  describe("hackathon lead access", () => {
    let h: Awaited<ReturnType<typeof startHarness>>;
    let A: string, B: string, staff: Person;

    const hackathon = async () =>
      (await h.prisma.hackathon.create({
        data: {
          title: `Hack ${h.uniq()}`, description: "d", organizer: "DevUp", prizePool: "₹1", mode: "ONLINE", isActive: true,
          startDate: new Date(Date.now() + 10 * 86_400_000), endDate: new Date(Date.now() + 11 * 86_400_000),
          registrationDeadline: new Date(Date.now() + 5 * 86_400_000),
        },
      })).id;

    async function register(hackathonId: string, overrides: Record<string, unknown> = {}) {
      const phone = nextPhone();
      const body = {
        name: "Team Lead", email: `lead-${h.uniq()}@example.test`, phone, teamCount: 2, teamName: "Rockets", college: "IIT Test",
        members: [{ name: "Member Two", email: `m2-${h.uniq()}@example.test`, phone: "9123456789" }],
        ...overrides,
      };
      const r = await h.call("POST", `/api/hackathons/${hackathonId}/lead`, undefined, body);
      return { r, phone, email: body.email as string };
    }
    const me = (hid: string, token?: string, method = "GET", body?: unknown, suffix = "") =>
      h.call(method, `/api/hackathons/${hid}/leads/me${suffix}`, undefined, body, token ? { "X-Lead-Token": token } : {});

    before(async () => {
      h = await startHarness(DB);
      A = await hackathon();
      B = await hackathon();
      staff = await h.person("staff", "ADMIN");
    });
    after(async () => h?.close());

    test("registration returns a private token, not the registration id; only its hash is stored", async () => {
      const { r, phone } = await register(A);
      assert.equal(r.status, 201);
      assert.deepEqual(Object.keys(r.body.data), ["accessToken"]);
      const lead = await h.prisma.hackathonLead.findUnique({ where: { hackathonId_phone: { hackathonId: A, phone } } });
      assert.equal(lead.accessTokenHash, sha(r.body.data.accessToken));
      assert.ok(!JSON.stringify(r.body).includes(lead.id));
    });

    test("registration requires an email (it is how a team recovers access)", async () => {
      const { r } = await register(A, { email: undefined });
      assert.equal(r.status, 400);
    });

    test("a phone number no longer reveals a registration", async () => {
      const { phone } = await register(A);
      const r = await h.call("GET", `/api/hackathons/${A}/submissions/status?phone=${phone}`);
      assert.equal(r.status, 404);
      assert.ok(!JSON.stringify(r.body).includes("Member Two"));
    });

    test("the old id-addressed routes are gone and cannot modify a registration", async () => {
      const { phone } = await register(A);
      const lead = await h.prisma.hackathonLead.findUnique({ where: { hackathonId_phone: { hackathonId: A, phone } } });
      assert.equal((await h.call("PATCH", `/api/hackathons/${A}/leads/${lead.id}`, undefined, { teamName: "Hijacked" })).status, 404);
      assert.equal((await h.call("PATCH", `/api/hackathons/${A}/lead/${lead.id}/redirect`)).status, 404);
      const after = await h.prisma.hackathonLead.findUnique({ where: { id: lead.id } });
      assert.equal(after.teamName, "Rockets");
      assert.equal(after.redirectedAt, null);
    });

    test("without a valid token: refused", async () => {
      assert.equal((await me(A)).status, 401);
      assert.equal((await me(A, "x".repeat(43))).status, 401);
      assert.equal((await me(A, undefined, "PATCH", { teamName: "Hijacked" })).status, 401);
      assert.equal((await me(A, undefined, "PATCH", undefined, "/redirect")).status, 401);
    });

    test("a token works only in its own hackathon", async () => {
      const { r } = await register(A);
      assert.equal((await me(A, r.body.data.accessToken)).status, 200);
      assert.equal((await me(B, r.body.data.accessToken)).status, 401);
    });

    test("with its token a team reads its own registration — no internal ids or token material", async () => {
      const { r } = await register(A);
      const res = await me(A, r.body.data.accessToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.data.teamName, "Rockets");
      for (const k of ["id", "accessTokenHash", "accessLinkSentAt", "hackathonId", "phone", "email"]) {
        assert.ok(!(k in res.body.data), `no ${k}`);
      }
    });

    test("a team updates only its own registration; identity fields in the body are ignored", async () => {
      const one = await register(A);
      const two = await register(A);
      const res = await me(A, one.r.body.data.accessToken, "PATCH", {
        teamName: "Renamed", phone: two.phone, hackathonId: B, accessTokenHash: "x", name: "Someone else",
      });
      assert.equal(res.status, 200);
      const l1 = await h.prisma.hackathonLead.findUnique({ where: { hackathonId_phone: { hackathonId: A, phone: one.phone } } });
      const l2 = await h.prisma.hackathonLead.findUnique({ where: { hackathonId_phone: { hackathonId: A, phone: two.phone } } });
      assert.equal(l1.teamName, "Renamed");
      assert.equal(l1.name, "Team Lead");
      assert.equal(l1.hackathonId, A);
      assert.equal(l1.accessTokenHash, sha(one.r.body.data.accessToken));
      assert.equal(l2.teamName, "Rockets");
    });

    test("submitting needs the token, and goes to the token's own team", async () => {
      const { r, phone } = await register(A);
      const form = () => {
        const f = new FormData();
        f.append("file", new Blob([Buffer.from("%PDF-1.4 test")], { type: "application/pdf" }), "deck.pdf");
        return f;
      };
      const url = `/api/hackathons/${A}/leads/me/submission`;
      assert.equal((await h.upload(url, form())).status, 401);
      assert.equal((await h.upload(url, form(), { "X-Lead-Token": "x".repeat(43) })).status, 401);
      const ok = await h.upload(url, form(), { "X-Lead-Token": r.body.data.accessToken });
      assert.equal(ok.status, 201);
      assert.ok(!("leadId" in ok.body.data) && !("fileUrl" in ok.body.data), "no internal ids or storage paths");
      const lead = await h.prisma.hackathonLead.findUnique({
        where: { hackathonId_phone: { hackathonId: A, phone } },
        include: { submission: true },
      });
      assert.ok(lead.submission);
    });

    test("'email me my link' answers identically, sends only to the inbox on file, and retires the old token", async () => {
      const { r, phone, email } = await register(A);
      const before = h.mails.length;
      const known = await h.call("POST", `/api/hackathons/${A}/leads/access-link`, undefined, { phone });
      const unknown = await h.call("POST", `/api/hackathons/${A}/leads/access-link`, undefined, { phone: nextPhone() });
      assert.equal(known.status, 202);
      assert.deepEqual(known.body, unknown.body);
      const sent = h.mails.slice(before);
      assert.equal(sent.length, 1, "exactly one email, for the registered phone");
      assert.equal(sent[0].to, email);
      const fresh = /#lead=([A-Za-z0-9_-]+)/.exec(sent[0].html ?? "")?.[1];
      assert.ok(fresh, "link carries the token in the URL fragment");
      assert.equal((await me(A, fresh)).status, 200);
      assert.equal((await me(A, r.body.data.accessToken)).status, 401, "previous token retired");
    });

    test("a legacy registration without an email is left alone — its token is not rotated by strangers", async () => {
      // Older registrations have no email. Knowing their phone must not let anyone
      // churn their token (logging the team out) or trigger mail to nowhere.
      const phone = nextPhone();
      const lead = await h.prisma.hackathonLead.create({
        data: { hackathonId: A, name: "Legacy", phone, teamCount: 1, college: "Old College" },
      });
      const leadAccess = require("../src/modules/hackathons/leadAccess.service");
      const token = await leadAccess.issueLeadToken(lead.id);
      const before = h.mails.length;
      const r = await h.call("POST", `/api/hackathons/${A}/leads/access-link`, undefined, { phone });
      assert.equal(r.status, 202);
      assert.equal(h.mails.length, before, "no email sent");
      assert.equal((await me(A, token)).status, 200, "existing token still works");
    });

    test("access links are throttled per team, also under concurrency", async () => {
      const { phone } = await register(A);
      const before = h.mails.length;
      await Promise.all(Array.from({ length: 4 }, () => h.call("POST", `/api/hackathons/${A}/leads/access-link`, undefined, { phone })));
      assert.equal(h.mails.length - before, 1, "one email despite simultaneous requests");
    });

    test("repeated attempts for one number are rate limited", async () => {
      const phone = nextPhone();
      const statuses: number[] = [];
      for (let i = 0; i < 7; i++) {
        statuses.push((await h.call("POST", `/api/hackathons/${A}/leads/access-link`, undefined, { phone })).status);
      }
      assert.ok(statuses.includes(429), `statuses ${statuses}`);
    });

    test("the admin lead list does not expose token material", async () => {
      await register(A);
      const r = await h.call("GET", `/api/hackathons/${A}/leads`, staff.token);
      assert.equal(r.status, 200);
      assert.ok(r.body.data.length > 0);
      assert.ok(r.body.data.every((l: any) => !("accessTokenHash" in l)));
    });

  });
}
