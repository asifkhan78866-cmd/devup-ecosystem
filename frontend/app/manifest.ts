import { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${seoConfig.siteName} — DEVTHON ${new Date().getFullYear()}`,
    short_name: "DEVTHON",
    description: seoConfig.siteDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#000000",
    lang: "en-IN",
    dir: "ltr",
    categories: ["education", "technology", "productivity", "business"],
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/images/devup-logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Hackathons", short_name: "Hackathons", url: "/hackathons" },
      { name: "Apply", short_name: "Apply", url: "/apply" },
      { name: "Ecosystem", short_name: "Ecosystem", url: "/ecosystem" },
    ],
  };
}
