/**
 * AI research rate limits and client-IP handling.
 *
 * The research service itself is replaced by a counter, so nothing here reaches
 * a website or OpenRouter. Limits are set small through the environment.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { startHarness, testDatabaseUrl, Person, SRC } from "./support/harness";

const PER_USER = 3;
const PER_IP = 5;
const DAILY = 30; // the per-account and per-IP tests together spend ~20 of this
const CF = "162.158.10.20"; // a Cloudflare edge address (trusted proxy)

// Pure checks on the proxy-trust function — no database needed.
describe("which proxies are trusted to report the client IP", () => {
  test("Cloudflare and private/loopback hops are trusted; arbitrary public addresses are not", () => {
    const express = require("express");
    const { applyTrustProxy } = require(path.join(SRC, "config/proxy"));
    const app = express();
    applyTrustProxy(app);
    const trust = app.get("trust proxy fn");
    for (const ip of ["162.158.1.1", "104.16.0.1", "2606:4700::1", "10.1.2.3", "127.0.0.1", "::1"]) {
      assert.equal(trust(ip, 0), true, `${ip} trusted`);
    }
    for (const ip of ["203.0.113.5", "8.8.8.8", "2001:db8::1"]) {
      assert.equal(trust(ip, 0), false, `${ip} not trusted`);
    }
  });
});

// Production refuses to start with a limit that is not a positive integer.
describe("AI limit configuration fails closed", () => {
  const load = (value: string) => {
    const r = spawnSync(process.execPath, ["-r", "ts-node/register", "-e", `require(${JSON.stringify(path.join(SRC, "config/env.ts"))})`], {
      cwd: require("node:os").tmpdir(),
      env: {
        PATH: process.env.PATH ?? "", NODE_ENV: "test", AI_RESEARCH_RATE_LIMIT: value,
        TS_NODE_PROJECT: path.resolve(SRC, "../tsconfig.json"), NODE_PATH: path.resolve(SRC, "../node_modules"),
      },
      encoding: "utf8",
    });
    return r.status;
  };
  for (const bad of ["", "abc", "0", "-5", "2.5"]) {
    test(`AI_RESEARCH_RATE_LIMIT=${JSON.stringify(bad)} is rejected`, () => assert.equal(load(bad), 1));
  }
  test("a valid value starts", () => assert.equal(load("10"), 0));
});

const DB = testDatabaseUrl();
if (!DB) {
  test("AI research limits (needs TEST_DATABASE_URL on localhost)", { skip: true }, () => {});
} else {
  describe("AI research limits", () => {
    let h: Awaited<ReturnType<typeof startHarness>>;
    let calls = 0;
    let ipSeq = 0;
    const freshIp = () => `198.51.100.${++ipSeq}`;

    before(async () => {
      h = await startHarness(DB, {
        env: { AI_RESEARCH_RATE_LIMIT: String(PER_USER), AI_RESEARCH_IP_LIMIT: String(PER_IP), AI_RESEARCH_DAILY_MAX: String(DAILY), AI_RESEARCH_RATE_WINDOW_MS: "3600000" },
        stubs: {
          "modules/ai/webResearch.service": {
            researchStartup: async () => {
              calls++;
              return { cached: false, analysis: { summary: "stub" } };
            },
          },
        },
      });
    });
    after(async () => h?.close());

    /** A research request as if from client \`ip\`, arriving through Cloudflare. */
    const research = (who: Person | null, ip: string, body: Record<string, unknown> = {}, spoof?: string) =>
      h.call("POST", "/api/ai/research-startup", who?.token, {
        startupName: "Acme", websiteUrl: "https://acme.example.test", ...body,
      }, { "X-Forwarded-For": [spoof, ip, CF].filter(Boolean).join(", ") });

    test("one account: the configured number of calls, then 429 — and the service is no longer invoked", async () => {
      const u = await h.person("ai-one", "FOUNDER");
      const ip = freshIp();
      const before = calls;
      const statuses = [];
      for (let i = 0; i < PER_USER + 2; i++) statuses.push((await research(u, ip)).status);
      assert.deepEqual(statuses, [...Array(PER_USER).fill(200), 429, 429]);
      assert.equal(calls - before, PER_USER, "research ran only for allowed requests");
      const r = await research(u, ip);
      assert.equal(r.body.code, "AI_RATE_LIMITED");
      assert.ok(r.headers.get("ratelimit") || r.headers.get("ratelimit-limit"), "standard rate-limit headers");
    });

    test("changing the body (name, URL, ids) does not reset an account's limit", async () => {
      const u = await h.person("ai-body", "FOUNDER");
      const ip = freshIp();
      for (let i = 0; i < PER_USER; i++) assert.equal((await research(u, ip, { startupName: `Name ${i}` })).status, 200);
      const r = await research(u, ip, { startupName: "Totally different", websiteUrl: "https://other.example.test", email: "x@y.z" });
      assert.equal(r.status, 429);
    });

    test("different accounts have separate budgets", async () => {
      const ip1 = freshIp();
      const ip2 = freshIp();
      const a = await h.person("ai-a", "FOUNDER");
      const b = await h.person("ai-b", "FOUNDER");
      for (let i = 0; i < PER_USER; i++) assert.equal((await research(a, ip1)).status, 200);
      assert.equal((await research(a, ip1)).status, 429);
      assert.equal((await research(b, ip2)).status, 200, "another account is unaffected");
    });

    test("many accounts from one client IP share the per-IP budget", async () => {
      const ip = freshIp();
      const statuses: number[] = [];
      for (let i = 0; i < PER_IP + 2; i++) {
        const u = await h.person(`ai-farm-${i}`, "FOUNDER");
        statuses.push((await research(u, ip)).status);
      }
      assert.equal(statuses.filter((s) => s === 200).length, PER_IP);
      assert.ok(statuses.slice(PER_IP).every((s) => s === 429));
    });

    test("a client cannot escape the per-IP limit by forging X-Forwarded-For entries", async () => {
      const ip = freshIp();
      let ok = 0;
      for (let i = 0; i < PER_IP + 3; i++) {
        const u = await h.person(`ai-spoof-${i}`, "FOUNDER");
        // Each request claims a different "client" in front of the real one.
        const r = await research(u, ip, {}, `203.0.113.${i + 1}`);
        if (r.status === 200) ok++;
      }
      assert.equal(ok, PER_IP, "forged leading entries are ignored; the real client IP is limited");
    });

    test("unauthenticated and unauthorised callers are refused before any budget is spent", async () => {
      const before = calls;
      assert.equal((await research(null, freshIp())).status, 401);
      const student = await h.person("ai-student", "STUDENT");
      assert.equal((await research(student, freshIp())).status, 403);
      assert.equal(calls, before);
    });

    test("the global daily ceiling holds however traffic is spread", async () => {
      // Everything above used part of the shared ceiling; spread the rest thinly.
      let lastStatus = 0;
      let refusedByGlobal = false;
      for (let i = 0; i < DAILY + 2; i++) {
        const u = await h.person(`ai-spread-${i}`, "FOUNDER");
        const r = await research(u, freshIp());
        lastStatus = r.status;
        if (r.status === 429) { refusedByGlobal = true; break; }
      }
      assert.ok(refusedByGlobal, `expected the daily ceiling to refuse (last ${lastStatus})`);
      assert.ok(calls <= DAILY, `research ran ${calls} times; ceiling ${DAILY}`);
    });
  });
}
