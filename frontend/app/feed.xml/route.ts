import { seoConfig } from "@/lib/seo";
import { LOCATIONS } from "@/lib/locations";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Revalidate the feed hourly. */
export const revalidate = 3600;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}

export async function GET() {
  const base = seoConfig.baseUrl;
  const items: FeedItem[] = [];

  // Live hackathons as feed items
  try {
    const res = await fetch(`${API}/api/hackathons?limit=50`, {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    const hackathons = json.data || [];
    for (const h of hackathons) {
      items.push({
        title: h.title || h.name || "DEVTHON Hackathon",
        link: `${base}/hackathons/${h.id}`,
        description:
          h.description ||
          "A national innovation hackathon by DevUp Ecosystem — build, innovate, and launch.",
        pubDate: new Date(h.createdAt || Date.now()).toUTCString(),
        guid: `${base}/hackathons/${h.id}`,
      });
    }
  } catch {
    // fall through to static items only
  }

  // Location landing pages as evergreen feed items
  for (const loc of LOCATIONS) {
    items.push({
      title: `${loc.isRegionPage ? "Hackathons" : "Hackathon"} in ${loc.city} 2026 — DEVTHON`,
      link: `${base}/hackathons-in/${loc.slug}`,
      description: `DEVTHON 2026 — the national innovation hackathon for students, developers and startups in ${loc.city}, ${loc.region}.`,
      pubDate: new Date("2026-07-16T00:00:00Z").toUTCString(),
      guid: `${base}/hackathons-in/${loc.slug}`,
    });
  }

  const now = new Date().toUTCString();
  const itemsXml = items
    .map(
      (it) => `    <item>
      <title>${esc(it.title)}</title>
      <link>${esc(it.link)}</link>
      <description>${esc(it.description)}</description>
      <pubDate>${it.pubDate}</pubDate>
      <guid isPermaLink="true">${esc(it.guid)}</guid>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(seoConfig.siteName)} — DEVTHON Hackathons &amp; Innovation</title>
    <link>${base}</link>
    <description>${esc(seoConfig.siteDescription)}</description>
    <language>en-IN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
