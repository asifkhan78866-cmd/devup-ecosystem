"use client";

import { seoConfig, devthonConfig } from "@/lib/seo";

/**
 * HackathonSchema — Comprehensive Event + EducationalEvent structured data (schema.org)
 * Generates a full JSON-LD @graph for rich event results in Google, AI search, and social.
 */
export default function HackathonSchema({ hackathon }: { hackathon: any }) {
  const city = hackathon.city || seoConfig.organization.addressLocality;
  const locationName = hackathon.location || "Vidya Jyothi Institute Of Technology";

  const eventUrl = `${seoConfig.baseUrl}/hackathons/${hackathon.id}`;

  const organizerOrg = {
    "@type": "Organization",
    "@id": `${seoConfig.baseUrl}/#organization`,
    name: seoConfig.organization.name,
    url: seoConfig.baseUrl,
    logo: seoConfig.organization.logo,
    sameAs: [
      seoConfig.social.instagram,
      seoConfig.social.linkedin,
      seoConfig.social.twitter,
    ],
  };

  const eventOrganizer = {
    "@type": "Organization",
    name: hackathon.organizer || "Vynedam",
    url: `${seoConfig.baseUrl}/hackathons`,
  };

  const founders = seoConfig.founders.map((f) => ({
    "@type": "Person",
    name: f.name,
    jobTitle: f.role,
    affiliation: { "@type": "Organization", name: seoConfig.organization.name },
    sameAs: [f.linkedin],
  }));

  const location =
    hackathon.mode !== "ONLINE"
      ? {
          "@type": "Place",
          name: locationName,
          address: {
            "@type": "PostalAddress",
            streetAddress: locationName,
            addressLocality: city,
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
          url: eventUrl,
        };

  const domainKeywords = devthonConfig.keywords.join(", ");

  const eventSchema = {
    "@type": ["Event", "EducationalEvent", "Hackathon"],
    "@id": eventUrl,
    name: hackathon.title || hackathon.name,
    alternateName: "DEVTHON 2026",
    description:
      hackathon.description || devthonConfig.description,
    startDate: hackathon.startDate,
    endDate: hackathon.endDate,
    duration: "PT36H",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode:
      hackathon.mode === "ONLINE"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : hackathon.mode === "HYBRID"
        ? "https://schema.org/MixedEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    location,
    image: [
      hackathon.bannerUrl || `${seoConfig.baseUrl}/images/devthon-og.jpg`,
      `${seoConfig.baseUrl}/devthon-poster.jpeg`,
    ],
    offers: {
      "@type": "Offer",
      name: hackathon.registrationFee ? "Registration" : "Free Registration",
      price: hackathon.registrationFee || "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
      validThrough: hackathon.registrationDeadline,
      url: eventUrl,
    },
    organizer: [organizerOrg, eventOrganizer],
    performer: {
      "@type": "Organization",
      name: "DevUp Ecosystem Community",
    },
    funder: organizerOrg,
    sponsor: [],
    maximumAttendeeCapacity: hackathon.maxParticipants || 500,
    keywords: domainKeywords,
    about: [
      "Artificial Intelligence & Machine Learning",
      "Generative AI",
      "Cybersecurity & Ethical Hacking",
      "Cloud Computing & DevOps",
      "Web Development",
      "Mobile App Development",
      "Software Engineering",
      "Data Science & Big Data Analytics",
      "Internet of Things (IoT)",
      "Robotics & Automation",
      "Drone Technology",
      "Blockchain & Web3",
      "HealthTech",
      "AgriTech",
      "FinTech",
      "EdTech",
      "Smart Cities",
      "Transportation & Mobility",
      "ClimateTech & Sustainability",
      "Renewable Energy",
      "Industry 4.0 & Smart Manufacturing",
      "GovTech",
      "SpaceTech",
      "Defence Technology",
      "AR/VR & Extended Reality",
      "UI/UX & Product Design",
      "Social Impact & Smart Communities",
      "Startup Innovation & Entrepreneurship",
      "Open Innovation",
      "Quantum Computing",
      "BioTech & Life Sciences",
      "Supply Chain & Logistics",
      "E-Commerce & Retail Technology",
      "Digital Media & Content Technology",
      "LegalTech & Compliance",
      "Smart Infrastructure & Construction Technology",
    ].map((d) => ({ "@type": "Thing", name: d })),
    audience: {
      "@type": "Audience",
      audienceType: "Students, Developers, Entrepreneurs, Startups, Innovators",
    },
    typicalAgeRange: "18-30",
    inLanguage: "en-IN",
    isAccessibleForFree: !hackathon.registrationFee,
    url: eventUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": eventUrl,
    },
    subEvent: [
      {
        "@type": "Event",
        name: "Phase 1 — Idea Submission",
        description: "Register your team, select your track, and submit a 1-page abstract or pitch deck.",
        startDate: hackathon.startDate,
        endDate: hackathon.startDate,
      },
      {
        "@type": "Event",
        name: "Phase 2 — 36-Hour Offline Hackathon",
        description: "Build, code, and pitch your solution in a 36-hour non-stop innovation sprint.",
        startDate: hackathon.startDate,
        endDate: hackathon.endDate,
      },
    ],
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      eventSchema,
      ...founders,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
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
    name: "DEVTHON 2026 & Upcoming Hackathons in India",
    description:
      "List of upcoming hackathons, coding competitions, innovation challenges, and startup events in Hyderabad and India — featuring DEVTHON 2026.",
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
