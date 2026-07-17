import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { seoConfig, canonicalUrl, devthonConfig } from "@/lib/seo";
import { getLocation, allLocationSlugs, type LocationData } from "@/lib/locations";
import JsonLd from "@/components/seo/JsonLd";

/* Statically pre-render every location page at build time (best CWV/SEO). */
export function generateStaticParams() {
  return allLocationSlugs().map((city) => ({ city }));
}

/* ISR: refresh once a day so live event data stays reasonably fresh. */
export const revalidate = 86400;

type Params = { params: Promise<{ city: string }> };

const YEAR = 2026;

function titleFor(loc: LocationData): string {
  return loc.isRegionPage
    ? `Hackathons in ${loc.city} ${YEAR} — DEVTHON | Best Innovation Hackathon`
    : `Hackathon in ${loc.city} ${YEAR} — DEVTHON | Best Innovation Hackathon`;
}

function descriptionFor(loc: LocationData): string {
  return `Looking for the best hackathon in ${loc.city} in ${YEAR}? DEVTHON is a national innovation hackathon by DevUp Ecosystem for students, developers, and startups across ${loc.region}. 36 innovation domains, prizes, internships, placements & startup incubation. Register now.`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city } = await params;
  const loc = getLocation(city);
  if (!loc) return {};

  const title = titleFor(loc);
  const description = descriptionFor(loc);
  const path = `/hackathons-in/${loc.slug}`;

  return {
    title,
    description,
    keywords: [
      `hackathon in ${loc.city}`,
      `hackathon ${loc.city} ${YEAR}`,
      `${loc.city} hackathon`,
      `best hackathon in ${loc.city}`,
      `upcoming hackathon ${loc.city}`,
      `coding competition ${loc.city}`,
      `college hackathon ${loc.city}`,
      `student hackathon ${loc.city}`,
      `AI hackathon ${loc.city}`,
      `innovation challenge ${loc.city}`,
      `hackathon near me ${loc.city}`,
      `tech event ${loc.city}`,
      `hackathon ${loc.region}`,
      ...devthonConfig.keywords,
    ],
    authors: [{ name: seoConfig.organization.name }],
    alternates: { canonical: canonicalUrl(path) },
    openGraph: {
      title,
      description,
      url: canonicalUrl(path),
      siteName: seoConfig.siteName,
      locale: seoConfig.locale,
      type: "website",
      images: [
        {
          url: devthonConfig.ogImage,
          width: 1200,
          height: 630,
          alt: `DEVTHON ${YEAR} — Hackathon for ${loc.city}, ${loc.region}, India`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: seoConfig.twitterHandle,
      title,
      description,
      images: [devthonConfig.ogImage],
    },
    other: {
      "geo.region": loc.regionCode,
      "geo.placename": loc.city,
      "geo.position": `${loc.geo.lat};${loc.geo.lng}`,
      ICBM: `${loc.geo.lat}, ${loc.geo.lng}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

/* ── FAQ content (server-rendered + surfaced in FAQPage schema) ── */
function buildFaqs(loc: LocationData) {
  const near = loc.isRegionPage ? loc.city : `${loc.city}, ${loc.region}`;
  return [
    {
      q: `Is there a hackathon in ${loc.city} in ${YEAR}?`,
      a: `Yes. DEVTHON ${YEAR} is a national innovation hackathon open to students, developers, designers, and startups from ${near} and across India. It is organized by DevUp Ecosystem and offers both on-ground participation at its Hyderabad venue and online participation for teams from ${loc.city}.`,
    },
    {
      q: `Which is the best hackathon for students in ${loc.city}?`,
      a: `DEVTHON is one of the most ambitious student hackathons available to participants from ${loc.city}. Beyond a 36-hour build sprint across 36 innovation domains, it adds startup incubation, paid internship and placement opportunities, and direct mentorship from industry leaders — going far beyond a traditional coding competition.`,
    },
    {
      q: `How can students from ${loc.city} register for DEVTHON?`,
      a: `Registration is free and open online. Visit the DEVTHON hackathons page, choose your innovation track, and register your team of up to 4 members. Teams from ${loc.city} can participate online, and finalists are invited to the on-ground grand finale.`,
    },
    {
      q: `What can participants from ${loc.city} win at DEVTHON?`,
      a: `DEVTHON offers a growing prize pool, paid internships with monthly stipends, startup incubation support, and networking with recruiters and investors — a strong opportunity for engineering students and early founders from ${loc.city} and ${loc.region}.`,
    },
    {
      q: `Which colleges in ${loc.city} can take part?`,
      a: `Students from every engineering college and university in ${loc.city} are welcome, including ${loc.colleges.slice(0, 3).join(", ")}, and many more across ${loc.region}. DEVTHON also runs a Campus Ambassador program for students who want to lead participation from their college.`,
    },
  ];
}

export default async function LocationPage({ params }: Params) {
  const { city } = await params;
  const loc = getLocation(city);
  if (!loc) notFound();

  const faqs = buildFaqs(loc);
  const path = `/hackathons-in/${loc.slug}`;
  const url = canonicalUrl(path);
  const kicker = loc.isRegionPage ? `Hackathons in ${loc.city}` : `Hackathon in ${loc.city}`;

  /* ── JSON-LD: Breadcrumb + FAQPage + Event (national, delivered to this city) ── */
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: seoConfig.baseUrl },
      { "@type": "ListItem", position: 2, name: "Hackathons", item: `${seoConfig.baseUrl}/hackathons` },
      { "@type": "ListItem", position: 3, name: kicker, item: url },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": ["Event", "EducationalEvent"],
    name: `DEVTHON ${YEAR} — Hackathon for ${loc.city}`,
    description: descriptionFor(loc),
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    startDate: `${YEAR}-08-01`,
    location: [
      {
        "@type": "Place",
        name: "Vidya Jyothi Institute of Technology (VJIT), Hyderabad",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hyderabad",
          addressRegion: "Telangana",
          addressCountry: "IN",
        },
      },
      { "@type": "VirtualLocation", url },
    ],
    organizer: {
      "@type": "Organization",
      name: seoConfig.organization.name,
      url: seoConfig.baseUrl,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${seoConfig.baseUrl}/hackathons`,
    },
    isAccessibleForFree: true,
    inLanguage: "en-IN",
    audience: {
      "@type": "Audience",
      audienceType: `Students, developers and startups in ${loc.city}, ${loc.region}, India`,
    },
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "120px 24px 96px" }}>
      <JsonLd data={breadcrumb} />
      <JsonLd data={faqSchema} />
      <JsonLd data={eventSchema} />

      {/* Breadcrumb trail (visible + crawlable) */}
      <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: "#a1a1a1", marginBottom: 24 }}>
        <Link href="/" style={{ color: "#a1a1a1" }}>Home</Link>
        {" / "}
        <Link href="/hackathons" style={{ color: "#a1a1a1" }}>Hackathons</Link>
        {" / "}
        <span style={{ color: "#c8f135" }}>{kicker}</span>
      </nav>

      <header style={{ marginBottom: 40 }}>
        <p style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13, color: "#c8f135", letterSpacing: 1, marginBottom: 12 }}>
          DEVTHON {YEAR} · {loc.region.toUpperCase()}
        </p>
        <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 44, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 20 }}>
          {loc.isRegionPage ? `Hackathons in ${loc.city} ${YEAR}` : `Hackathon in ${loc.city} ${YEAR}`}
        </h1>
        <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: 18, color: "#d4d4d4", lineHeight: 1.7 }}>
          {loc.blurb} DEVTHON {YEAR}, organized by DevUp Ecosystem, brings a national
          innovation hackathon to students, developers, designers, and startups from{" "}
          {loc.city} — with 36 innovation domains, prizes, internships, placements, and
          startup incubation.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
          <Link href="/hackathons" style={{ background: "#c8f135", color: "#000", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
            Register for DEVTHON {YEAR}
          </Link>
          <Link href="/apply" style={{ border: "1px solid #333", color: "#fff", padding: "14px 28px", borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: "none" }}>
            Explore the ecosystem
          </Link>
        </div>
      </header>

      <section aria-labelledby="why" style={{ marginBottom: 40 }}>
        <h2 id="why" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
          Why {loc.city} students should join DEVTHON {YEAR}
        </h2>
        <p style={{ fontSize: 16, color: "#a1a1a1", lineHeight: 1.8, marginBottom: 16 }}>
          {loc.city}{" "}has one of India&apos;s strongest pools of engineering and design talent,
          yet high-quality innovation hackathons that lead to real outcomes — internships,
          placements, funding, and incubation — remain rare. DEVTHON was built to close that
          gap. As a national hackathon, it welcomes teams from {loc.city} and all of{" "}
          {loc.region}, combining a 36-hour build sprint with a full innovation ecosystem
          behind it.
        </p>
        <p style={{ fontSize: 16, color: "#a1a1a1", lineHeight: 1.8 }}>
          Whether you are a first-year student writing your first line of code, a final-year
          engineer preparing for placements, or an early founder validating an idea, DEVTHON
          gives you a stage, mentors, and a direct line to recruiters and investors.
        </p>
      </section>

      <section aria-labelledby="tracks" style={{ marginBottom: 40 }}>
        <h2 id="tracks" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
          36 innovation domains open to {loc.city} participants
        </h2>
        <p style={{ fontSize: 16, color: "#a1a1a1", lineHeight: 1.8, marginBottom: 16 }}>
          Compete in the track that matches your passion — Artificial Intelligence &amp;
          Machine Learning, Generative AI, Cybersecurity, Blockchain &amp; Web3, Cloud &amp;
          DevOps, Web and Mobile Development, IoT, Robotics, Drone Technology, HealthTech,
          FinTech, EdTech, AgriTech, ClimateTech, SpaceTech, AR/VR, Quantum Computing,
          Smart Cities, and many more.
        </p>
      </section>

      <section aria-labelledby="colleges" style={{ marginBottom: 40 }}>
        <h2 id="colleges" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
          Colleges and universities in {loc.city} we welcome
        </h2>
        <ul style={{ color: "#a1a1a1", fontSize: 16, lineHeight: 2, paddingLeft: 20 }}>
          {loc.colleges.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p style={{ fontSize: 15, color: "#737373", lineHeight: 1.8, marginTop: 12 }}>
          Not listed? Every college in {loc.region} is welcome. Lead your campus through our{" "}
          Campus Ambassador program.
        </p>
      </section>

      {/* FAQ — server-rendered <details> so it is fully crawlable without JS */}
      <section aria-labelledby="faq" style={{ marginBottom: 40 }}>
        <h2 id="faq" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 20 }}>
          Frequently asked questions — Hackathon in {loc.city}
        </h2>
        {faqs.map((f) => (
          <details key={f.q} style={{ borderBottom: "1px solid #262626", padding: "16px 0" }}>
            <summary style={{ fontSize: 17, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
              {f.q}
            </summary>
            <p style={{ fontSize: 15, color: "#a1a1a1", lineHeight: 1.8, marginTop: 12 }}>{f.a}</p>
          </details>
        ))}
      </section>

      {/* Internal links to other locations — topic cluster + crawl depth */}
      <section aria-labelledby="other" style={{ marginTop: 56 }}>
        <h2 id="other" style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
          Hackathons in other cities
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {allLocationSlugs()
            .filter((s) => s !== loc.slug)
            .map((s) => (
              <Link
                key={s}
                href={`/hackathons-in/${s}`}
                style={{ fontSize: 13, color: "#a1a1a1", border: "1px solid #262626", borderRadius: 999, padding: "6px 14px", textDecoration: "none", textTransform: "capitalize" }}
              >
                Hackathon in {s}
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}
