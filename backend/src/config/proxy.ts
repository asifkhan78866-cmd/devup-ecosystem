import type { Express } from "express";

/**
 * Which proxies may tell us the client's IP.
 *
 * Production traffic arrives client → Cloudflare (Render's edge) → Render's
 * internal proxy → this process. Each hop appends to X-Forwarded-For. Express
 * walks that header from the right and stops at the first address it does not
 * trust, so trusting exactly these hops yields the real client IP, while
 * anything a client writes into the header itself sits further left and is
 * never reached. An untrusted socket's X-Forwarded-For is ignored entirely.
 *
 * Without this, every request appeared to come from the proxy, so every IP
 * rate limit was one shared bucket for all users.
 *
 * Cloudflare's ranges: https://www.cloudflare.com/ips/ (fetched 2026-10-10).
 * Extra CIDRs can be added with TRUSTED_PROXY_CIDRS (comma separated).
 */
export const CLOUDFLARE_RANGES = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
  "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
  "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32",
  "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32",
];

/** Render's internal hop and local development use private/loopback addresses. */
const LOCAL_PRESETS = ["loopback", "linklocal", "uniquelocal"];

export function trustedProxies(extra = process.env.TRUSTED_PROXY_CIDRS ?? "") {
  const added = extra.split(",").map((s) => s.trim()).filter(Boolean);
  return [...LOCAL_PRESETS, ...CLOUDFLARE_RANGES, ...added];
}

export function applyTrustProxy(app: Express) {
  app.set("trust proxy", trustedProxies());
}
