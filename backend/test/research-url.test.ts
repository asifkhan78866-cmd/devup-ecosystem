/**
 * AI research only ever targets public web addresses. Nothing here touches the
 * network: DNS is a stub, and outbound HTTP from the research service is
 * intercepted.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { startHarness, testDatabaseUrl, Person, SRC } from "./support/harness";

/* eslint-disable @typescript-eslint/no-var-requires */
const { assertPublicWebUrl, isPublicAddress } = require(path.join(SRC, "lib/publicUrl"));

/** Fake DNS: a few names, everything else unresolvable. */
const dnsTable: Record<string, string[]> = {
  "acme.example.com": ["93.184.216.34"],
  "dual.example.com": ["93.184.216.34", "2606:2800:220:1:248:1893:25c8:1946"],
  "rebind.example.com": ["93.184.216.34", "10.0.0.5"], // one private answer is enough to refuse
  "internal-looking.example.com": ["169.254.169.254"],
  "v6-loopback.example.com": ["::1"],
  "metadata.google.internal": ["93.184.216.34"],
  "printer.local": ["93.184.216.34"],
  "nas.lan": ["93.184.216.34"],
  "db.corp": ["93.184.216.34"],
  "intranet": ["93.184.216.34"],
  "app.localhost": ["93.184.216.34"],
};
const resolver = async (host: string) => {
  if (!(host in dnsTable)) throw new Error("ENOTFOUND");
  return dnsTable[host];
};
const ok = (u: string) => assertPublicWebUrl(u, resolver);
const refused = (u: string) =>
  assert.rejects(assertPublicWebUrl(u, resolver), (e: any) => e.code === "INVALID_RESEARCH_URL", u);

describe("public web address check", () => {
  test("ordinary public websites are accepted", async () => {
    assert.equal(await ok("https://acme.example.com/about?ref=x"), "https://acme.example.com/about?ref=x");
    await ok("http://dual.example.com");
    await ok("https://acme.example.com:443/");
    await ok("https://93.184.216.34/");
  });

  test("non-web schemes are refused", async () => {
    for (const u of ["ftp://acme.example.com", "file:///etc/passwd", "gopher://acme.example.com", "data:text/html,hi", "javascript:alert(1)"]) await refused(u);
  });

  test("credentials and non-default ports are refused", async () => {
    await refused("https://user:pass@acme.example.com/");
    await refused("http://acme.example.com:8080/");
    await refused("http://acme.example.com:6379/");
  });

  test("loopback, private, link-local and metadata addresses are refused in every spelling", async () => {
    for (const u of [
      "http://localhost/", "http://LOCALHOST./", "http://app.localhost/",
      "http://127.0.0.1/", "http://127.1/", "http://2130706433/", "http://0x7f000001/", "http://0x7f.0.0.1/", "http://017700000001/",
      "http://0.0.0.0/", "http://10.0.0.1/", "http://172.16.5.4/", "http://192.168.1.1/", "http://100.64.0.1/",
      "http://169.254.169.254/latest/meta-data/", "http://[::1]/", "http://[::ffff:127.0.0.1]/", "http://[::ffff:a9fe:a9fe]/",
      "http://[fd00::1]/", "http://[fe80::1]/",
    ]) await refused(u);
  });

  test("internal hostnames and single labels are refused", async () => {
    for (const u of ["http://intranet/", "http://metadata.google.internal/", "http://printer.local/", "http://nas.lan/", "http://db.corp/"]) await refused(u);
  });

  test("a name that resolves to any private address is refused (including mixed answers)", async () => {
    await refused("http://rebind.example.com/");
    await refused("http://internal-looking.example.com/");
    await refused("http://v6-loopback.example.com/");
  });

  test("unresolvable names and garbage are refused", async () => {
    await refused("http://does-not-exist.example.com/");
    await refused("not a url");
    await refused("");
  });

  test("address classification", () => {
    assert.equal(isPublicAddress("93.184.216.34"), true);
    assert.equal(isPublicAddress("2606:2800:220:1:248:1893:25c8:1946"), true);
    for (const a of ["127.0.0.1", "10.1.1.1", "169.254.169.254", "::1", "fd12::1", "::ffff:10.0.0.1", "not-an-ip"]) {
      assert.equal(isPublicAddress(a), false, a);
    }
  });
});

const DB = testDatabaseUrl();
if (!DB) {
  test("research endpoint URL handling (needs TEST_DATABASE_URL on localhost)", { skip: true }, () => {});
} else {
  describe("research endpoint", () => {
    let h: Awaited<ReturnType<typeof startHarness>>;
    let founder: Person;
    const outbound: string[] = [];
    let realFetch: typeof fetch;

    before(async () => {
      // Intercept only the research service's outbound calls; the harness still
      // talks to the app over real HTTP.
      realFetch = globalThis.fetch;
      globalThis.fetch = (async (input: any, init?: any) => {
        const url = String(typeof input === "string" ? input : input.url);
        if (url.startsWith("https://crawler.example.test") || url.includes("openrouter.ai")) {
          outbound.push(`${url} ${init?.body ? JSON.parse(init.body).url ?? "" : ""}`.trim());
          if (url.startsWith("https://crawler.example.test")) {
            return new Response("upstream said: secret internal detail", { status: 502 });
          }
          const analysis = { oneLiner: "x", overview: "x", problem: "x", solution: "x", targetMarket: "x", businessModel: "x", tractionSignals: [], fundingSignals: [], teamHighlights: [], redFlags: [], confidence: "low", sourcesUsed: [], generatedAt: new Date().toISOString() };
          return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(analysis) } }], usage: { total_tokens: 1 } }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return realFetch(input, init);
      }) as typeof fetch;
      h = await startHarness(DB, { env: { FIRECRAWL_BASE_URL: "https://crawler.example.test/v1", FIRECRAWL_API_KEY: "test-key" } });
      founder = await h.person("research", "FOUNDER");
    });
    after(async () => {
      globalThis.fetch = realFetch;
      await h?.close();
    });

    const research = (websiteUrl: string) =>
      h.call("POST", "/api/ai/research-startup", founder.token, { startupName: "Acme", websiteUrl });

    test("an internal target is refused before anything leaves the server", async () => {
      for (const u of ["http://169.254.169.254/latest/meta-data/", "http://127.0.0.1:6379/", "http://localhost/admin", "http://[::1]/"]) {
        const before = outbound.length;
        const r = await research(u);
        assert.equal(r.status, 400, u);
        assert.equal(r.body.code, "INVALID_RESEARCH_URL");
        assert.equal(outbound.length, before, `no outbound request for ${u}`);
      }
    });

    test("a public address goes to the crawler, and the crawler's raw error is not echoed", async () => {
      const before = outbound.length;
      const r = await research("https://93.184.216.34/");
      assert.ok(outbound.length > before, "crawler was called");
      assert.ok(outbound.some((o) => o.includes("crawler.example.test") && o.includes("93.184.216.34")));
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.ok(r.body.data.warnings.length > 0, "the failed crawl is reported");
      assert.ok(!JSON.stringify(r.body).includes("secret internal detail"), "third-party error text stays server-side");
    });
  });
}
