"use client";

import { seoConfig } from "@/lib/seo";

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
            name: hackathon.location || "Vidya Jyothi Institute Of Technology",
            address: {
              "@type": "PostalAddress",
              streetAddress: hackathon.location || "Vidya Jyothi Institute Of Technology",
              addressLocality: hackathon.city || seoConfig.organization.addressLocality,
              addressRegion: seoConfig.organization.addressRegion,
              postalCode: "500043",
              addressCountry: seoConfig.organization.addressCountry,
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: "17.5089",
              longitude: "78.3935",
            },
          }
        : {
            "@type": "VirtualLocation",
            url: `${seoConfig.baseUrl}/hackathons/${hackathon.id}`,
          },
    image: [
      hackathon.bannerUrl ||
        `${seoConfig.baseUrl}/og/hackathons.png`,
    ],
    offers: {
      "@type": "Offer",
      name: hackathon.registrationFee ? "Registration" : "Free Registration",
      price: hackathon.registrationFee || "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
      validThrough: hackathon.registrationDeadline,
      url: `${seoConfig.baseUrl}/hackathons/${hackathon.id}`,
    },
    organizer: [
      {
        "@type": "Organization",
        "@id": `${seoConfig.baseUrl}/#organization`,
        name: seoConfig.organization.name,
        url: seoConfig.baseUrl,
        logo: seoConfig.organization.logo,
        sameAs: [
          seoConfig.social.instagram,
          seoConfig.social.linkedin,
        ],
      },
      {
        "@type": "Organization",
        name: hackathon.organizer || "Vynedam",
        url: `${seoConfig.baseUrl}/hackathons`,
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
    ].join(", "),
    audience: {
      "@type": "Audience",
      audienceType: "Students, Developers, Entrepreneurs",
    },
    typicalAgeRange: "18-30",
    inLanguage: "en-IN",
    isAccessibleForFree: !hackathon.registrationFee,
    url: `${seoConfig.baseUrl}/hackathons/${hackathon.id}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${seoConfig.baseUrl}/hackathons/${hackathon.id}`,
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
    url: `${seoConfig.baseUrl}/hackathons`,
    numberOfItems: hackathons.length,
    itemListElement: hackathons.map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${seoConfig.baseUrl}/hackathons/${h.id}`,
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
 * BreadcrumbSchema — BreadcrumbList structured data for hackathon detail pages.
 * @deprecated Use the generic <BreadcrumbJsonLd> component instead for new routes.
 * Kept for backward compatibility with existing hackathon pages.
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
        item: seoConfig.baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Hackathons",
        item: `${seoConfig.baseUrl}/hackathons`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: hackathonName,
        item: `${seoConfig.baseUrl}/hackathons/${hackathonId}`,
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

