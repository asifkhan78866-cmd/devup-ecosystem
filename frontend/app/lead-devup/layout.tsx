import type { Metadata } from "next";
import { buildTitle, buildOgMetadata, buildTwitterMetadata, canonicalUrl, seoConfig } from "@/lib/seo";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import JsonLd from "@/components/seo/JsonLd";
import { getMediaUrl } from "@/lib/mediaMap";

const pageTitle = "Lead DevUp — Campus, City, Regional & State Director Roles";
// The root layout's title template already appends "| DevUp Ecosystem", so the bare
// page name goes in `title`. buildTitle() is only used for og/twitter, which the
// template does not apply to.
const socialTitle = buildTitle(pageTitle);
const description =
  "Apply to lead the DevUp student community in your campus, city, region or state. Build your own team, host hackathons and founder meets, and get real leadership experience.";

const pageUrl = canonicalUrl("/lead-devup");
const ogImage = getMediaUrl(
  "/showcase_photos_videos/WhatsApp Image 2026-08-18 at 12.13.16 AM.jpeg"
);
const SUPABASE_HOST =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mvwlyavbkcwlcjtoetks.supabase.co";

export const metadata: Metadata = {
  title: pageTitle,
  description,
  keywords:
    "DevUp, student leadership, campus chapters, hackathons, student tech community, campus director",
  openGraph: buildOgMetadata({
    title: socialTitle,
    description,
    path: "/lead-devup",
    image: ogImage,
    imageAlt: "DevUp community showcase",
  }),
  twitter: buildTwitterMetadata({
    title: socialTitle,
    description,
    image: ogImage,
  }),
  alternates: {
    canonical: canonicalUrl("/lead-devup"),
  },
};

// Ported from the former head.tsx: `head` is not a recognised segment file in this
// version of Next, so nothing in it ever reached the document. The metadata above
// and the JSON-LD below reproduce it through APIs that actually render.
const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Lead DevUp",
  description,
  url: pageUrl,
};

const applyActionJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: seoConfig.siteName,
  url: seoConfig.baseUrl,
  potentialAction: {
    "@type": "ApplyAction",
    target: pageUrl,
    name: "Apply to Lead DevUp",
  },
};

export default function LeadDevUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Every reel and photo on this page is served from Supabase, so warming the
          connection ahead of the first request is worth a round trip. */}
      <link rel="preconnect" href={SUPABASE_HOST} crossOrigin="anonymous" />
      <BreadcrumbJsonLd items={[{ name: "Lead DevUp", path: "/lead-devup" }]} />
      <JsonLd data={webPageJsonLd} />
      <JsonLd data={applyActionJsonLd} />
      {children}
    </>
  );
}
