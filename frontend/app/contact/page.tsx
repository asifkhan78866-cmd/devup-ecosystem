import type { Metadata } from "next";
import { buildOgMetadata, buildTwitterMetadata, canonicalUrl, seoConfig } from "@/lib/seo";
import ContentPage, { H2, P, CTA } from "@/components/seo/ContentPage";
import JsonLd from "@/components/seo/JsonLd";

const CONTACT_EMAIL = "devupecosystem@gmail.com";

const title = "Contact DEVTHON & DevUp Ecosystem";
const description =
  "Get in touch with the DEVTHON team at DevUp Ecosystem, Hyderabad, Telangana. Reach out for hackathon queries, partnerships, sponsorships, campus ambassador and volunteer opportunities, or media requests.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "contact DEVTHON",
    "DevUp Ecosystem contact",
    "hackathon partnership",
    "hackathon sponsorship India",
    "hackathon media contact",
    "DevUp Ecosystem Hyderabad",
  ],
  alternates: { canonical: canonicalUrl("/contact") },
  openGraph: buildOgMetadata({ title, description, path: "/contact" }),
  twitter: buildTwitterMetadata({ title, description }),
};

export default function ContactPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${seoConfig.baseUrl}/#organization`,
    name: seoConfig.organization.name,
    url: seoConfig.baseUrl,
    email: CONTACT_EMAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: seoConfig.organization.addressLocality,
      addressRegion: seoConfig.organization.addressRegion,
      addressCountry: seoConfig.organization.addressCountry,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: CONTACT_EMAIL,
        areaServed: "IN",
        availableLanguage: ["en", "hi", "te"],
      },
      {
        "@type": "ContactPoint",
        contactType: "sponsorship",
        email: CONTACT_EMAIL,
        areaServed: "IN",
      },
    ],
    sameAs: [seoConfig.social.twitter, seoConfig.social.linkedin, seoConfig.social.instagram],
  };

  const rows: { label: string; value: string; href?: string }[] = [
    { label: "General & participant queries", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
    { label: "Partnerships & sponsorships", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}?subject=Partnership%20/%20Sponsorship` },
    { label: "Media & press", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}?subject=Media%20Request` },
    { label: "Location", value: "Hyderabad, Telangana, India" },
    { label: "LinkedIn", value: "DevUp Ecosystem", href: seoConfig.social.linkedin },
    { label: "Instagram", value: "@devupecosystem", href: seoConfig.social.instagram },
  ];

  return (
    <ContentPage
      kicker="CONTACT · HYDERABAD, INDIA"
      title="Contact DEVTHON & DevUp Ecosystem"
      intro="Whether you're a participant, college, sponsor, mentor, or journalist — we'd love to hear from you."
      breadcrumb={[{ name: "Contact", path: "/contact" }]}
    >
      <JsonLd data={contactSchema} />

      <div style={{ margin: "8px 0 24px" }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "16px 0", borderBottom: "1px solid #262626", flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, color: "#a1a1a1" }}>{r.label}</span>
            {r.href ? (
              <a href={r.href} style={{ fontSize: 15, color: "#c8f135", textDecoration: "none", fontWeight: 600 }}>
                {r.value}
              </a>
            ) : (
              <span style={{ fontSize: 15, color: "#fff", fontWeight: 600 }}>{r.value}</span>
            )}
          </div>
        ))}
      </div>

      <H2>Get involved</H2>
      <P>
        Want to do more than participate? Lead your campus as a DEVTHON Campus Ambassador, join the
        volunteer team, or bring your organization on board as a partner or sponsor. Email us with
        the subject line that matches your interest and our team will get back to you.
      </P>

      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <CTA href="/campus-ambassador" label="Become a Campus Ambassador" />
        <CTA href="/hackathons" label="Register for DEVTHON 2026" primary={false} />
      </div>
    </ContentPage>
  );
}
