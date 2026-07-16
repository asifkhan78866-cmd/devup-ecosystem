/**
 * Central SEO configuration for DevUp Ecosystem.
 * All routes should import from here to ensure consistency.
 */

export const seoConfig = {
  siteName: "DevUp Ecosystem",
  siteDescription:
    "India's student-driven innovation & startup ecosystem — hackathons, co-founder matching, careers, and ventures including Zappy, Yarnia, PortalX, and more.",
  baseUrl: "https://www.devupecosystem.com",
  defaultOgImage: "/video/hero-space-poster.jpg",
  defaultOgImageAlt: "DevUp Ecosystem — India's Student-Driven Innovation & Startup Ecosystem",
  locale: "en_IN",
  twitterHandle: "@devupeco",
  social: {
    twitter: "https://twitter.com/devupeco",
    linkedin: "https://www.linkedin.com/company/devup-ecosystem",
    instagram: "https://www.instagram.com/devupecosystem",
    // TODO: Add Discord, YouTube, and other social profiles when available
  },
  organization: {
    name: "DevUp Ecosystem",
    legalName: "DevUp Ecosystem",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    addressCountry: "IN",
    logo: "https://www.devupecosystem.com/images/devup-logo.png",
  },
  ventures: [
    "Zappy",
    "Yarnia",
    "Kroshay",
    "Elnora",
    "PortalX",
    "StartupsIndia",
    "CineShot AI",
    "CourtAI",
  ],
  founders: [
    {
      name: "Syed Asif",
      role: "Co-Founder & CEO",
      linkedin: "https://www.linkedin.com/in/syed-asif20",
    },
    {
      name: "Faizan Mohammed",
      role: "Co-Founder & CTO",
      linkedin: "https://www.linkedin.com/in/faizanmohammed07tech",
    },
  ],
} as const;

/** Helper: Build a page title using the standard pattern. */
export function buildTitle(page?: string): string {
  if (!page) {
    return `${seoConfig.siteName} — India's Student-Driven Innovation & Startup Ecosystem`;
  }
  return `${page} | ${seoConfig.siteName}`;
}

/** Helper: Build a canonical URL from a path. */
export function canonicalUrl(path: string): string {
  // Ensure leading slash, remove trailing slash
  const clean = path.startsWith("/") ? path : `/${path}`;
  const noTrailing = clean === "/" ? "" : clean.replace(/\/+$/, "");
  return `${seoConfig.baseUrl}${noTrailing}`;
}

/** Helper: Build default OpenGraph metadata for a page. */
export function buildOgMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
}) {
  return {
    title: opts.title,
    description: opts.description,
    url: canonicalUrl(opts.path),
    siteName: seoConfig.siteName,
    locale: seoConfig.locale,
    type: opts.type ?? ("website" as const),
    images: [
      {
        url: opts.image ?? seoConfig.defaultOgImage,
        width: 1200,
        height: 630,
        alt: opts.imageAlt ?? opts.title,
      },
    ],
  };
}

/** Helper: Build default Twitter card metadata. */
export function buildTwitterMetadata(opts: {
  title: string;
  description: string;
  image?: string;
}) {
  return {
    card: "summary_large_image" as const,
    site: seoConfig.twitterHandle,
    title: opts.title,
    description: opts.description,
    images: [opts.image ?? seoConfig.defaultOgImage],
  };
}

/* ══════════════════════════════════════════════════════════════════
   DEVTHON 2026 — Dedicated SEO configuration
   Used by hackathon detail pages and hackathon listing layouts.
   ══════════════════════════════════════════════════════════════════ */

export const devthonConfig = {
  title: "DEVTHON 2026 | Building Asia's Largest Innovation Hackathon",
  metaTitle:
    "DEVTHON 2026 – Building Asia's Largest Innovation Hackathon | Innovation, Startups, AI, Placements & Incubation",
  description:
    "DEVTHON 2026 is a national innovation ecosystem bringing together developers, designers, entrepreneurs, startups, mentors, recruiters, investors, and innovators. Participate across 36 innovation domains, build impactful solutions, gain internship and placement opportunities, receive startup incubation, and network with industry leaders.",
  ogDescription:
    "Join thousands of innovators, developers, startups, mentors, investors and recruiters in one of India's most ambitious innovation ecosystems.",
  twitterDescription: "Build. Innovate. Launch. Join the innovation movement.",
  ogImage: "/images/devthon-og.jpg",
  ogImageAlt: "DEVTHON 2026 – Building Asia's Largest Innovation Hackathon banner",
  themeColor: "#000000",
  author: "DevUp Ecosystem",
  publisher: "DevUp Ecosystem",
  keywords: [
    "DEVTHON",
    "Hackathon India",
    "Innovation Hackathon",
    "AI Hackathon",
    "National Hackathon",
    "Student Hackathon",
    "Startup Hackathon",
    "Technology Competition",
    "Coding Competition",
    "Programming Contest",
    "Artificial Intelligence",
    "Machine Learning",
    "Cybersecurity",
    "Blockchain",
    "Web Development",
    "Mobile Development",
    "Cloud Computing",
    "DevOps",
    "Startup Incubation",
    "Internship Drive",
    "Placement Drive",
    "Innovation Challenge",
    "Engineering Hackathon",
    "College Hackathon",
    "Software Development",
    "Entrepreneurship",
    "Developer Event",
    "Innovation Festival",
    "Future Technology",
    "Open Innovation",
    "Smart India",
    "Tech Competition",
    "Startup Ecosystem",
    "India Innovation",
    "Technology Event",
    "Innovation Summit",
    "Hackathon Hyderabad",
  ],
  targetSearchQueries: [
    "Hackathon India",
    "Best Hackathon",
    "Innovation Hackathon",
    "AI Hackathon India",
    "National Level Hackathon",
    "Student Innovation Challenge",
    "Coding Competition India",
    "Engineering Hackathon",
    "Software Development Competition",
    "Startup Competition",
    "Innovation Event",
    "Tech Fest",
    "Startup Incubation Program",
    "Internship Opportunities",
    "Placement Drive",
    "Innovation Ecosystem",
  ],
} as const;

/** Helper: Build DEVTHON-specific OpenGraph metadata. */
export function buildDevthonOgMetadata(opts: {
  title?: string;
  description?: string;
  path: string;
  image?: string;
}) {
  return {
    title: opts.title ?? devthonConfig.title,
    description: opts.description ?? devthonConfig.ogDescription,
    url: canonicalUrl(opts.path),
    siteName: "DEVTHON",
    locale: seoConfig.locale,
    type: "website" as const,
    images: [
      {
        url: opts.image ?? devthonConfig.ogImage,
        width: 1200,
        height: 630,
        alt: devthonConfig.ogImageAlt,
      },
    ],
  };
}

/** Helper: Build DEVTHON-specific Twitter card metadata. */
export function buildDevthonTwitterMetadata(opts?: {
  title?: string;
  description?: string;
  image?: string;
}) {
  return {
    card: "summary_large_image" as const,
    site: seoConfig.twitterHandle,
    title: opts?.title ?? "DEVTHON 2026",
    description: opts?.description ?? devthonConfig.twitterDescription,
    images: [opts?.image ?? devthonConfig.ogImage],
  };
}
