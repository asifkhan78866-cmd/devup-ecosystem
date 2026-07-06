import { Metadata } from "next";
import { buildTitle, buildOgMetadata, buildTwitterMetadata, canonicalUrl } from "@/lib/seo";

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Our Ventures | DevUp Ecosystem Portfolio",
            "description": description,
            "url": "https://www.devupecosystem.com/ecosystem"
          })
        }}
      />
      {children}
    </>
  );
}

