import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Ventures | DevUp Ecosystem Portfolio",
  description: "Explore the ventures and companies built within the DevUp Ecosystem: Yarnia, PortalX, Zappy, Elnora, Kroshay, and more.",
  openGraph: {
    title: "Our Ventures | DevUp Ecosystem Portfolio",
    description: "Explore the ventures and companies built within the DevUp Ecosystem: Yarnia, PortalX, Zappy, Elnora, Kroshay, and more.",
  }
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
            "description": "Explore the ventures and companies built within the DevUp Ecosystem: Yarnia, PortalX, Zappy, Elnora, Kroshay, and more.",
            "url": "https://www.devupecosystem.com/ecosystem"
          })
        }}
      />
      {children}
    </>
  );
}
