import { BlockList, isIP } from "net";
import { promises as dns } from "dns";
import { AppError } from "../middleware/errorHandler";

/**
 * Is this a public website address — the only kind the product researches?
 *
 * AI research hands the URL to an external crawler (Firecrawl) that fetches it
 * from its own network, so today nothing reaches DevUp's infrastructure. This
 * check keeps it that way if the crawler is ever self-hosted, and stops our
 * crawler account being pointed at internal-looking targets, odd ports or
 * credential-bearing URLs.
 *
 * Parsing goes through WHATWG URL, which normalises the alternate spellings an
 * attacker would reach for (2130706433, 0x7f.1, [::ffff:127.0.0.1]) into
 * canonical addresses before they are checked. The hostname is also resolved,
 * and every address it resolves to must be public.
 */

const blocked = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blocked.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of [
  ["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8], ["2001:db8::", 32], ["64:ff9b::", 96],
] as const) blocked.addSubnet(net, prefix, "ipv6");

const INTERNAL_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home", ".corp", ".intranet", ".home.arpa"];

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, "ipv4");
  // IPv4-mapped IPv6 (::ffff:a.b.c.d, ::ffff:7f00:1) is matched against the
  // IPv4 rules by BlockList itself.
  if (family === 6) return !blocked.check(address, "ipv6");
  return false;
}

const reject = () =>
  new AppError(400, "Enter the startup's public website address (http or https).", "INVALID_RESEARCH_URL");

export type Resolver = (hostname: string) => Promise<string[]>;
const systemResolver: Resolver = async (hostname) =>
  (await dns.lookup(hostname, { all: true, verbatim: true })).map((a) => a.address);

/** Returns the normalised URL, or throws a 400. */
export async function assertPublicWebUrl(raw: string, resolve: Resolver = systemResolver): Promise<string> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw reject();
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw reject();
  if (url.username || url.password) throw reject();
  if (url.port && url.port !== "80" && url.port !== "443") throw reject();

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host) throw reject();

  if (isIP(host)) {
    if (!isPublicAddress(host)) throw reject();
    return url.toString();
  }

  if (host === "localhost" || !host.includes(".") || INTERNAL_SUFFIXES.some((s) => host.endsWith(s))) {
    throw reject();
  }

  let addresses: string[];
  try {
    addresses = await Promise.race([
      resolve(host),
      new Promise<string[]>((_, fail) => setTimeout(() => fail(new Error("dns timeout")), 3000)),
    ]);
  } catch {
    throw reject();
  }
  if (addresses.length === 0 || !addresses.every(isPublicAddress)) throw reject();
  return url.toString();
}
