import React from "react";
import mapping from "@/lib/supabase_mapping.json";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://devup-ecosystem.vercel.app";
const SUPABASE_HOST =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://mvwlyavbkcwlcjtoetks.supabase.co";

const ogImage =
  mapping[
    "showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.16 AM.jpeg"
  ] || Object.values(mapping)[0];

export default function Head() {
  const title = "Lead DevUp — Join & Lead Student Communities | DevUp";
  const description =
    "Apply to be a DevUp leader — build campus chapters, run events, and connect students with startups, mentors, and opportunities. Lead DevUp in your city or campus.";
  const url = `${SITE_URL}/lead-devup`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Lead DevUp",
      description,
      url,
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "DevUp",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: ogImage,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Lead DevUp", item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "DevUp",
      url: SITE_URL,
      potentialAction: {
        "@type": "ApplyAction",
        target: url,
        name: "Apply to Lead DevUp",
      },
    },
  ];

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="keywords"
        content="DevUp, student leadership, campus chapters, hackathons, student tech community, campus director"
      />
      <meta name="author" content="DevUp" />
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogImage && (
        <meta property="og:image:alt" content="DevUp community showcase" />
      )}
      {ogImage && <meta property="og:image:width" content="1200" />}
      {ogImage && <meta property="og:image:height" content="630" />}
      <meta property="og:site_name" content="DevUp" />
      <meta name="twitter:site" content="@devup" />
      <link rel="alternate" hrefLang="en" href={url} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Performance / preconnect */}
      <link rel="preconnect" href={SUPABASE_HOST} crossOrigin="anonymous" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
