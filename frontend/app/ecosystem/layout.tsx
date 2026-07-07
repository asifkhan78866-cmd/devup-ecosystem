import { Metadata } from "next";
import { buildTitle, buildOgMetadata, buildTwitterMetadata, canonicalUrl, seoConfig } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

const title = buildTitle("Our Ventures");
const description =
  "Explore the ventures and startups built within the DevUp Ecosystem: Zappy, Yarnia, Kroshay, Elnora, PortalX, StartupsIndia, CineShot AI, CourtAI, and more.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalUrl("/ecosystem"),
  },
  openGraph: buildOgMetadata({
    title,
    description,
    path: "/ecosystem",
  }),
  twitter: buildTwitterMetadata({ title, description }),
};

export default function EcosystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Our Ventures | DevUp Ecosystem Portfolio",
        "description": description,
        "url": canonicalUrl("/ecosystem"),
        "isPartOf": {
          "@type": "WebSite",
          "@id": `${seoConfig.baseUrl}/#website`,
        },
      }} />
      <BreadcrumbJsonLd items={[{ name: "Ventures", path: "/ecosystem" }]} />
      {children}
    </>
  );
}
