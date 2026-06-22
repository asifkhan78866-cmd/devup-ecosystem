import { MetadataRoute } from "next";

const BASE_URL = "https://www.devupecosystem.com";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
      lastModified: new Date(h.updatedAt || h.createdAt || new Date()),
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
      url: `${BASE_URL}/ecosystem/${s.slug}`,
      lastModified: new Date(s.updatedAt || s.createdAt || new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Continue with empty startup URLs
  }

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/hackathons`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/ecosystem`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/careers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/cofounders`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/apply`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/build-with-devup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...hackathonUrls,
    ...startupUrls,
  ];
}
