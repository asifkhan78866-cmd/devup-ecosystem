import type { Metadata } from "next";
import Link from "next/link";
import { buildOgMetadata, buildTwitterMetadata, canonicalUrl, seoConfig } from "@/lib/seo";
import { sortedPosts } from "@/lib/blog";
import ContentPage from "@/components/seo/ContentPage";
import JsonLd from "@/components/seo/JsonLd";

const title = "Blog — Hackathons, AI, Careers & Innovation";
const description =
  "The DEVTHON blog by DevUp Ecosystem — guides on hackathons, AI, coding, careers, internships, placements, startups, and student innovation. Practical, no-fluff advice for India's builders.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "hackathon blog",
    "hackathon tips",
    "AI blog India",
    "coding career advice",
    "student innovation blog",
    "internship placement tips",
    "startup advice students",
  ],
  alternates: { canonical: canonicalUrl("/blog") },
  openGraph: buildOgMetadata({ title, description, path: "/blog" }),
  twitter: buildTwitterMetadata({ title, description }),
};

export default function BlogIndexPage() {
  const posts = sortedPosts();

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${seoConfig.baseUrl}/blog#blog`,
    name: `${seoConfig.siteName} Blog`,
    description,
    url: canonicalUrl("/blog"),
    publisher: { "@id": `${seoConfig.baseUrl}/#organization` },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      url: canonicalUrl(`/blog/${p.slug}`),
      author: { "@type": "Organization", name: p.author },
    })),
  };

  return (
    <ContentPage
      kicker="INSIGHTS · GUIDES"
      title="The DEVTHON Blog"
      intro="Practical, no-fluff guides on hackathons, AI, coding, careers, and startups — written for India's students and builders."
      breadcrumb={[{ name: "Blog", path: "/blog" }]}
    >
      <JsonLd data={blogSchema} />

      <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            style={{ display: "block", border: "1px solid #262626", borderRadius: 14, padding: "22px 24px", background: "#0f0f0f", textDecoration: "none" }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, color: "#c8f135" }}>{p.category.toUpperCase()}</span>
              <span style={{ fontSize: 12, color: "#737373" }}>· {p.readingTime} min read</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.25 }}>
              {p.title}
            </h2>
            <p style={{ fontSize: 15, color: "#a1a1a1", lineHeight: 1.7 }}>{p.description}</p>
            <span style={{ display: "inline-block", marginTop: 12, fontSize: 14, color: "#c8f135", fontWeight: 600 }}>Read article →</span>
          </Link>
        ))}
      </div>
    </ContentPage>
  );
}
