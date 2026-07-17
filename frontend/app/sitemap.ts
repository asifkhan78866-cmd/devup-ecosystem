import { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo";
import { LOCATIONS } from "@/lib/locations";
import { BLOG_POSTS } from "@/lib/blog";

const BASE_URL = seoConfig.baseUrl;
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Stable date for static routes so that the sitemap doesn't change on every
 * request. Update this when you deploy meaningful content changes to static pages.
 */
const STATIC_LAST_MODIFIED = new Date("2026-07-16T00:00:00Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch hackathons
  let hackathonUrls: MetadataRoute.Sitemap = [];
  try {
    const hackathonsRes = await fetch(`${API}/api/hackathons?limit=100`, {
      next: { revalidate: 3600 },
    });
    const hackathonsData = await hackathonsRes.json();
    const hackathons = hackathonsData.data || [];
    hackathonUrls = hackathons.map((h: any) => ({
      url: `${BASE_URL}/hackathons/${h.id}`,
      lastModified: new Date(h.updatedAt || h.createdAt),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));
  } catch {
    // Continue with empty hackathon URLs
  }

  // Fetch startups
  let startupUrls: MetadataRoute.Sitemap = [];
  try {
    const startupsRes = await fetch(`${API}/api/startups?limit=100`, {
      next: { revalidate: 3600 },
    });
    const startupsData = await startupsRes.json();
    const startups = startupsData.data?.startups || [];
    startupUrls = startups.map((s: any) => ({
      url: `${BASE_URL}/ecosystem/${s.id}`,
      lastModified: new Date(s.updatedAt || s.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Continue with empty startup URLs
  }

  // Fetch jobs for individual career pages
  let jobUrls: MetadataRoute.Sitemap = [];
  try {
    const jobsRes = await fetch(`${API}/api/jobs?limit=100`, {
      next: { revalidate: 3600 },
    });
    const jobsData = await jobsRes.json();
    const jobs = jobsData.data || [];
    jobUrls = jobs.map((j: any) => ({
      url: `${BASE_URL}/careers/${j.id}`,
      lastModified: new Date(j.updatedAt || j.createdAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    // Continue with empty job URLs
  }

  // Programmatic local-SEO landing pages (/hackathons-in/<city>)
  const locationUrls: MetadataRoute.Sitemap = LOCATIONS.map((loc) => ({
    url: `${BASE_URL}/hackathons-in/${loc.slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: "weekly" as const,
    priority: loc.tier === "primary" ? 0.9 : 0.7,
  }));

  // Static content / SEO pages
  const contentUrls: MetadataRoute.Sitemap = [
    { path: "/about", priority: 0.8, freq: "monthly" },
    { path: "/domains", priority: 0.9, freq: "monthly" },
    { path: "/faq", priority: 0.8, freq: "monthly" },
    { path: "/schedule", priority: 0.8, freq: "weekly" },
    { path: "/contact", priority: 0.6, freq: "monthly" },
    { path: "/campus-ambassador", priority: 0.7, freq: "monthly" },
    { path: "/blog", priority: 0.7, freq: "weekly" },
    { path: "/privacy", priority: 0.3, freq: "yearly" },
    { path: "/terms", priority: 0.3, freq: "yearly" },
    { path: "/code-of-conduct", priority: 0.3, freq: "yearly" },
  ].map((p) => ({
    url: `${BASE_URL}${p.path}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: p.freq as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: p.priority,
  }));

  // Blog posts
  const blogUrls: MetadataRoute.Sitemap = BLOG_POSTS.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updated ?? p.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/hackathons`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/ecosystem`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/careers`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/cofounders`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/apply`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/build-with-devup`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...contentUrls,
    ...blogUrls,
    ...locationUrls,
    ...hackathonUrls,
    ...startupUrls,
    ...jobUrls,
  ];
}

