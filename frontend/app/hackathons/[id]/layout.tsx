import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getHackathon(id: string) {
  try {
    const res = await fetch(`${API}/api/hackathons/${id}`, {
      next: { revalidate: 1800 },
    });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const hackathon = await getHackathon(id);

  if (!hackathon) {
    return {
      title: "Hackathon | DevUp Ecosystem",
      description: "View hackathon details on DevUp Ecosystem.",
    };
  }

  const city = hackathon.city || "Hyderabad";
  const location = hackathon.location || city;
  const month = hackathon.startDate
    ? new Date(hackathon.startDate).toLocaleString("en", { month: "long" })
    : "July";
  const year = hackathon.startDate
    ? new Date(hackathon.startDate).getFullYear()
    : 2026;

  const title = `${hackathon.title} — ${location} | DevUp Ecosystem`;
  const description = `${hackathon.title}: ${(hackathon.description || "National-level hackathon").slice(0, 140)}. Prize pool: ${hackathon.prizePool || "₹1,00,000+"}. Date: ${hackathon.startDate ? new Date(hackathon.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}. Venue: ${location}. Register now on DevUp Ecosystem.`;

  return {
    title,
    description,
    keywords: [
      hackathon.title,
      `hackathon in ${city}`,
      `hackathon ${city} ${year}`,
      `${city} hackathon`,
      "hackathon near me",
      `hackathon India ${year}`,
      `hackathon in ${month} ${year}`,
      "national hackathon India",
      "student hackathon",
      "coding competition India",
      `hackathon ${location}`,
      "hackathon with prizes India",
      "hackathon with internship stipend",
      "36 hour hackathon",
      "Vynedam Talent Hunt",
      "Vynedam 2K26",
      "MRDU hackathon",
      "Malla Reddy University hackathon",
      `hackathon ${month} ${year}`,
      "best hackathon India",
      `tech hackathon ${city}`,
      `startup hackathon ${year}`,
    ],
    openGraph: {
      title,
      description,
      url: `https://www.devupecosystem.com/hackathons/${id}`,
      siteName: "DevUp Ecosystem",
      images: [
        {
          url:
            hackathon.bannerUrl ||
            "https://www.devupecosystem.com/og/hackathons.png",
          width: 1200,
          height: 630,
          alt: `${hackathon.title} — ${location}`,
        },
      ],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        hackathon.bannerUrl ||
          "https://www.devupecosystem.com/og/hackathons.png",
      ],
    },
    alternates: {
      canonical: `https://www.devupecosystem.com/hackathons/${id}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function HackathonDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
