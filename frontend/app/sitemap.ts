import { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo";

const BASE_URL = seoConfig.baseUrl;
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Stable date for static routes so that the sitemap doesn't change on every
 * request. Update this when you deploy meaningful content changes to static pages.
 */
const STATIC_LAST_MODIFIED = new Date("2026-07-07T00:00:00Z");

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
    ...hackathonUrls,
    ...startupUrls,
    ...jobUrls,
  ];
}

