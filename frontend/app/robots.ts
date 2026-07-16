import { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/admin",
          "/login",
          "/signup",
          "/invite/",
          "/api/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/login", "/signup", "/api/"],
      },
      // ─── AI Search Crawlers ───
      // Explicitly allow AI-powered search engines to index DEVTHON content
      // for maximum visibility in ChatGPT Search, Google AI Overview, Gemini,
      // Perplexity, and Claude.
      {
        userAgent: "GPTBot",
        allow: ["/", "/hackathons/"],
        disallow: ["/dashboard", "/admin", "/login", "/signup", "/api/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/hackathons/"],
        disallow: ["/dashboard", "/admin", "/login", "/signup", "/api/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/hackathons/"],
        disallow: ["/dashboard", "/admin", "/login", "/signup", "/api/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/hackathons/"],
        disallow: ["/dashboard", "/admin", "/login", "/signup", "/api/"],
      },
      {
        userAgent: "Anthropic",
        allow: ["/", "/hackathons/"],
        disallow: ["/dashboard", "/admin", "/login", "/signup", "/api/"],
      },
      {
        userAgent: "CCBot",
        allow: ["/", "/hackathons/"],
        disallow: ["/dashboard", "/admin", "/login", "/signup", "/api/"],
      },
    ],
    sitemap: `${seoConfig.baseUrl}/sitemap.xml`,
    host: seoConfig.baseUrl,
  };
}
