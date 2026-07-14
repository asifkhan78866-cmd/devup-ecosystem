import type { Metadata } from "next";
import { canonicalUrl, seoConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title:
    "Hackathons in Hyderabad 2026 | DevUp Ecosystem",
  description:
    "Find upcoming hackathons in Hyderabad, India 2026. Student hackathons, coding competitions, ₹1,50,000+ prizes, internships & mentorship. Register on DevUp.",
  keywords: [
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
    "hackathon in July 2026",
    "VJIT hackathon",
    "Vidya Jyothi hackathon",
    "DevUp hackathon",
    "hackathon for students India",
    "coding hackathon 2026",
  ],
  openGraph: {
    title: "Hackathons in Hyderabad 2026 | DevUp Ecosystem",
    description:
      "Upcoming hackathons, coding competitions, and startup challenges in Hyderabad and across India. ₹1,50,000+ prizes, paid internships, mentorship.",
    url: canonicalUrl("/hackathons"),
    siteName: seoConfig.siteName,
    images: [
      {
        url: "https://www.devupecosystem.com/og/hackathons.png",
        width: 1200,
        height: 630,
        alt: "Hackathons in Hyderabad 2026 — DevUp Ecosystem",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hackathons in Hyderabad 2026 | DevUp Ecosystem",
    description:
      "Find the best upcoming hackathons in Hyderabad and India. Register now.",
    images: ["https://www.devupecosystem.com/og/hackathons.png"],
  },
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
