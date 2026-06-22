"use client";

/**
 * HackathonSchema — Event structured data (schema.org/Event)
 * Generates the JSON-LD that Google uses to show rich event results.
 */
export default function HackathonSchema({ hackathon }: { hackathon: any }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: hackathon.title || hackathon.name,
    description:
      hackathon.description ||
      `${hackathon.title} — A national-level hackathon in ${hackathon.city || "Hyderabad"}, India. ${hackathon.prizePool || "₹1,00,000+"} prize pool, internship opportunities, and mentorship from industry experts.`,
    startDate: hackathon.startDate,
    endDate: hackathon.endDate,
    duration: "PT36H",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode:
      hackathon.mode === "ONLINE"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    location:
      hackathon.mode !== "ONLINE"
        ? {
            "@type": "Place",
            name: hackathon.location || "Malla Reddy Deemed to be University",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Malla Reddy Deemed to be University",
              addressLocality: "Hyderabad",
              addressRegion: "Telangana",
              postalCode: "500043",
              addressCountry: "IN",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: "17.5089",
              longitude: "78.3935",
            },
          }
        : {
            "@type": "VirtualLocation",
            url: `https://www.devupecosystem.com/hackathons/${hackathon.id}`,
          },
    image: [
      hackathon.bannerUrl ||
        "https://www.devupecosystem.com/og/hackathons.png",
    ],
    offers: {
      "@type": "Offer",
      name: "Free Registration",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
      validThrough: hackathon.registrationDeadline,
      url: `https://www.devupecosystem.com/hackathons/${hackathon.id}`,
    },
    organizer: [
      {
        "@type": "Organization",
        name: "DevUp Ecosystem",
        url: "https://www.devupecosystem.com",
        logo: "https://www.devupecosystem.com/icon.png",
        sameAs: [
          "https://www.instagram.com/devupecosystem",
          "https://www.linkedin.com/company/devupecosystem",
        ],
      },
      {
        "@type": "Organization",
        name: hackathon.organizer || "Vynedam",
        url: "https://www.devupecosystem.com/hackathons",
      },
    ],
    performer: {
      "@type": "Organization",
      name: "DevUp Ecosystem Community",
    },
    maximumAttendeeCapacity: hackathon.maxParticipants || 500,
    keywords: [
      "hackathon",
      "Hyderabad hackathon",
      "national hackathon India",
      "coding competition",
      "student hackathon",
      "tech competition",
      "36 hour hackathon",
      "startup hackathon",
      "hackathon 2026",
      "Malla Reddy University",
    ].join(", "),
    audience: {
      "@type": "Audience",
      audienceType: "Students, Developers, Entrepreneurs",
    },
    typicalAgeRange: "18-30",
    inLanguage: "en-IN",
    isAccessibleForFree: true,
    url: `https://www.devupecosystem.com/hackathons/${hackathon.id}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.devupecosystem.com/hackathons/${hackathon.id}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * HackathonListSchema — ItemList structured data for the listing page.
 * Helps Google understand the page lists multiple hackathons.
 */
export function HackathonListSchema({
  hackathons,
}: {
  hackathons: { id: string; name: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Upcoming Hackathons in India 2026",
    description:
      "List of upcoming hackathons, coding competitions, and tech events in Hyderabad and India",
    url: "https://www.devupecosystem.com/hackathons",
    numberOfItems: hackathons.length,
    itemListElement: hackathons.map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.devupecosystem.com/hackathons/${h.id}`,
      name: h.name,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * BreadcrumbSchema — BreadcrumbList structured data.
 * Shows breadcrumb trail in Google SERPs.
 */
export function BreadcrumbSchema({
  hackathonName,
  hackathonId,
}: {
  hackathonName: string;
  hackathonId: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.devupecosystem.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Hackathons",
        item: "https://www.devupecosystem.com/hackathons",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: hackathonName,
        item: `https://www.devupecosystem.com/hackathons/${hackathonId}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
