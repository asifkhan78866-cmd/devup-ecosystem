import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildOgMetadata, buildTwitterMetadata, canonicalUrl, seoConfig } from "@/lib/seo";
import { getPost, allPostSlugs, sortedPosts, type Block } from "@/lib/blog";
import JsonLd from "@/components/seo/JsonLd";

export function generateStaticParams() {
  return allPostSlugs().map((slug) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const path = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    alternates: { canonical: canonicalUrl(path) },
    openGraph: {
      ...buildOgMetadata({ title: post.title, description: post.description, path, type: "article" }),
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
    },
    twitter: buildTwitterMetadata({ title: post.title, description: post.description }),
  };
}

function renderBlock(b: Block, i: number) {
  switch (b.type) {
    case "h2":
      return (
        <h2 key={i} style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 26, fontWeight: 700, color: "#fff", margin: "40px 0 14px", lineHeight: 1.25 }}>
          {b.text}
        </h2>
      );
    case "p":
      return (
        <p key={i} style={{ fontSize: 17, color: "#c4c4c4", lineHeight: 1.85, margin: "0 0 18px" }}>
          {b.text}
        </p>
      );
    case "ul":
      return (
        <ul key={i} style={{ color: "#c4c4c4", fontSize: 17, lineHeight: 1.9, paddingLeft: 22, margin: "0 0 18px" }}>
          {b.items.map((it, j) => (
            <li key={j} style={{ marginBottom: 8 }}>{it}</li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote key={i} style={{ borderLeft: "3px solid #c8f135", paddingLeft: 20, margin: "24px 0", fontSize: 19, fontStyle: "italic", color: "#fff", lineHeight: 1.6 }}>
          {b.text}
        </blockquote>
      );
  }
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const path = `/blog/${post.slug}`;
  const url = canonicalUrl(path);
  const related = sortedPosts().filter((p) => p.slug !== post.slug).slice(0, 2);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { "@type": "Organization", name: post.author, url: seoConfig.baseUrl },
    publisher: {
      "@type": "Organization",
      name: seoConfig.organization.name,
      logo: { "@type": "ImageObject", url: seoConfig.organization.logo },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: [`${seoConfig.baseUrl}${seoConfig.defaultOgImage}`],
    keywords: post.keywords.join(", "),
    articleSection: post.category,
    inLanguage: "en-IN",
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: seoConfig.baseUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${seoConfig.baseUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "120px 24px 96px" }}>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumb} />

      <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: "#a1a1a1", marginBottom: 24 }}>
        <Link href="/" style={{ color: "#a1a1a1" }}>Home</Link>
        {" / "}
        <Link href="/blog" style={{ color: "#a1a1a1" }}>Blog</Link>
        {" / "}
        <span style={{ color: "#c8f135" }}>{post.category}</span>
      </nav>

      <article>
        <header style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12, color: "#c8f135" }}>{post.category.toUpperCase()}</span>
            <span style={{ fontSize: 13, color: "#737373" }}>
              · {new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {post.readingTime} min read
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 40, fontWeight: 800, color: "#fff", lineHeight: 1.12, marginBottom: 20 }}>
            {post.title}
          </h1>
          <p style={{ fontSize: 19, color: "#d4d4d4", lineHeight: 1.7 }}>{post.lead}</p>
        </header>

        {post.body.map(renderBlock)}
      </article>

      {/* Author / publisher line for E-E-A-T */}
      <p style={{ fontSize: 14, color: "#737373", marginTop: 40, paddingTop: 20, borderTop: "1px solid #262626" }}>
        Written by {post.author}, the team behind DEVTHON — a national innovation hackathon based in
        Hyderabad, India.
      </p>

      {related.length > 0 && (
        <section aria-labelledby="related" style={{ marginTop: 40 }}>
          <h2 id="related" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
            Keep reading
          </h2>
          <div style={{ display: "grid", gap: 12 }}>
            {related.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} style={{ display: "block", border: "1px solid #262626", borderRadius: 12, padding: "16px 18px", textDecoration: "none" }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{p.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div style={{ marginTop: 40, padding: "24px", background: "#0f0f0f", border: "1px solid #262626", borderRadius: 14 }}>
        <p style={{ fontSize: 17, color: "#fff", fontWeight: 700, marginBottom: 8, fontFamily: "var(--font-syne), sans-serif" }}>
          Ready to build?
        </p>
        <p style={{ fontSize: 15, color: "#a1a1a1", lineHeight: 1.7, marginBottom: 16 }}>
          Put this into practice at DEVTHON 2026 — India&apos;s national innovation hackathon with prizes, internships, and startup incubation.
        </p>
        <Link href="/hackathons" style={{ background: "#c8f135", color: "#000", padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", display: "inline-block" }}>
          Register for DEVTHON 2026
        </Link>
      </div>
    </main>
  );
}
