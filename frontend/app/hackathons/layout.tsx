import type { Metadata } from "next";
import { canonicalUrl, seoConfig, devthonConfig, buildDevthonOgMetadata, buildDevthonTwitterMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title:
    "DEVTHON 2026 – Building Asia's Largest Innovation Hackathon | Hackathons in Hyderabad",
  description: devthonConfig.description,
  keywords: [
    ...devthonConfig.keywords,
    "hackathon in Hyderabad",
    "hackathon near me",
    "hackathon 2026",
    "upcoming hackathon India",
    "student hackathon Hyderabad",
    "coding competition Hyderabad",
    "best hackathon India 2026",
    "hackathon with prizes",
    "hackathon with internship",
    "startup hackathon India",
    "tech competition Hyderabad",
    "national hackathon 2026",
    "hackathon in August 2026",
    "VJIT hackathon",
    "Vidya Jyothi hackathon",
    "DevUp hackathon",
    "hackathon for students India",
    "coding hackathon 2026",
  ],
  authors: [{ name: devthonConfig.author }],
  creator: devthonConfig.publisher,
  publisher: devthonConfig.publisher,
  openGraph: buildDevthonOgMetadata({
    title: "DEVTHON 2026 – Building Asia's Largest Innovation Hackathon | Hackathons in Hyderabad",
    description: devthonConfig.ogDescription,
    path: "/hackathons",
    image: devthonConfig.ogImage,
  }),
  twitter: buildDevthonTwitterMetadata({
    title: "DEVTHON 2026 | Hackathons in Hyderabad & India",
    description: devthonConfig.twitterDescription,
    image: devthonConfig.ogImage,
  }),
  alternates: {
    canonical: canonicalUrl("/hackathons"),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
};

export default function HackathonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
