import type { ReactNode } from "react";
import Link from "next/link";
import { seoConfig, canonicalUrl } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";

export interface Crumb {
  name: string;
  path: string;
}

/* ── Shared prose primitives (server components, SEO-friendly markup) ── */

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      style={{
        fontFamily: "var(--font-syne), sans-serif",
        fontSize: 26,
        fontWeight: 700,
        color: "#fff",
        margin: "40px 0 16px",
      }}
    >
      {children}
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "var(--font-syne), sans-serif",
        fontSize: 19,
        fontWeight: 700,
        color: "#fff",
        margin: "28px 0 10px",
      }}
    >
      {children}
    </h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 16, color: "#a1a1a1", lineHeight: 1.8, margin: "0 0 16px" }}>
      {children}
    </p>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 18, color: "#d4d4d4", lineHeight: 1.7, margin: "0 0 8px" }}>
      {children}
    </p>
  );
}

export function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ color: "#a1a1a1", fontSize: 16, lineHeight: 1.9, paddingLeft: 22, margin: "0 0 16px" }}>
      {items.map((it, i) => (
        <li key={i} style={{ marginBottom: 6 }}>
          {it}
        </li>
      ))}
    </ul>
  );
}

export function CTA({ href, label, primary = true }: { href: string; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      style={
        primary
          ? { background: "#c8f135", color: "#000", padding: "13px 26px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", display: "inline-block" }
          : { border: "1px solid #333", color: "#fff", padding: "13px 26px", borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: "none", display: "inline-block" }
      }
    >
      {label}
    </Link>
  );
}

/* ── Server-rendered FAQ (crawlable <details>) + optional FAQPage schema ── */
export function FaqBlock({ faqs, withSchema = true }: { faqs: { q: string; a: string }[]; withSchema?: boolean }) {
  return (
    <>
      {withSchema && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }}
        />
      )}
      {faqs.map((f) => (
        <details key={f.q} style={{ borderBottom: "1px solid #262626", padding: "16px 0" }}>
          <summary style={{ fontSize: 17, fontWeight: 600, color: "#fff", cursor: "pointer" }}>{f.q}</summary>
          <p style={{ fontSize: 15, color: "#a1a1a1", lineHeight: 1.8, marginTop: 12 }}>{f.a}</p>
        </details>
      ))}
    </>
  );
}

/**
 * ContentPage — shared shell for static SEO content pages.
 * Renders a visible + JSON-LD breadcrumb trail and a titled header.
 * `breadcrumb` should NOT include Home (added automatically).
 */
export default function ContentPage({
  kicker,
  title,
  intro,
  breadcrumb,
  lastUpdated,
  children,
}: {
  kicker?: string;
  title: string;
  intro?: ReactNode;
  breadcrumb: Crumb[];
  lastUpdated?: string;
  children: ReactNode;
}) {
  const crumbs: Crumb[] = [{ name: "Home", path: "/" }, ...breadcrumb];
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: canonicalUrl(c.path),
    })),
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "120px 24px 96px" }}>
      <JsonLd data={breadcrumbSchema} />

      <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: "#a1a1a1", marginBottom: 24 }}>
        {crumbs.map((c, i) => (
          <span key={c.path}>
            {i > 0 && " / "}
            {i < crumbs.length - 1 ? (
              <Link href={c.path} style={{ color: "#a1a1a1" }}>
                {c.name}
              </Link>
            ) : (
              <span style={{ color: "#c8f135" }}>{c.name}</span>
            )}
          </span>
        ))}
      </nav>

      <header style={{ marginBottom: 32 }}>
        {kicker && (
          <p style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13, color: "#c8f135", letterSpacing: 1, marginBottom: 12 }}>
            {kicker}
          </p>
        )}
        <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 44, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: intro ? 20 : 0 }}>
          {title}
        </h1>
        {intro && (typeof intro === "string" ? <Lead>{intro}</Lead> : intro)}
        {lastUpdated && (
          <p style={{ fontSize: 13, color: "#737373", marginTop: 12 }}>Last updated: {lastUpdated}</p>
        )}
      </header>

      <article>{children}</article>
    </main>
  );
}

export { seoConfig };
