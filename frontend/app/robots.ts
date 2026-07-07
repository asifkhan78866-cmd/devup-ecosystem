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
    ],
    sitemap: `${seoConfig.baseUrl}/sitemap.xml`,
    host: seoConfig.baseUrl,
  };
}

