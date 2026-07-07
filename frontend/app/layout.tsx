import type { Metadata } from "next";
import { Inter, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import LayoutClient from "@/components/LayoutClient";
import BackendWakeUp from "@/components/BackendWakeUp";
import { seoConfig, buildTitle, buildOgMetadata, buildTwitterMetadata } from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const homepageTitle = buildTitle();
const homepageDescription = seoConfig.siteDescription;

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.baseUrl),
  title: {
    default: homepageTitle,
    template: `%s | ${seoConfig.siteName}`,
  },
  description: homepageDescription,
  keywords: "DevUp Ecosystem, student startup ecosystem India, student innovation hub Hyderabad, hackathons, co-founder matching, college innovation, Indian startups, entrepreneurship",
  alternates: {
    canonical: seoConfig.baseUrl,
  },
  openGraph: buildOgMetadata({
    title: homepageTitle,
    description: homepageDescription,
    path: "/",
  }),
  twitter: buildTwitterMetadata({
    title: homepageTitle,
    description: homepageDescription,
  }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${inter.variable} ${syne.variable} ${jetbrainsMono.variable} antialiased dark`}>
      <head>
        <link rel="preload" as="image" href="/video/hero-space-poster.jpg" />
        {/* Geo targeting for India/Hyderabad — helps local search ranking */}
        <meta name="geo.region" content="IN-TG" />
        <meta name="geo.placename" content="Hyderabad" />
        <meta name="geo.position" content="17.3850;78.4867" />
        <meta name="ICBM" content="17.3850, 78.4867" />
        <meta httpEquiv="content-language" content="en-IN" />
        {/* Synchronous script — runs BEFORE paint, before React hydrates.
            Tags <html> with data-skip-intro for returning visitors so CSS
            can instantly hide the overlay with zero flash. */}
        <script 
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var seen = sessionStorage.getItem('devup_intro_seen');
                  if (seen) {
                    document.documentElement.setAttribute('data-skip-intro', 'true');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
        <script 
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${seoConfig.baseUrl}/#organization`,
                  "name": seoConfig.organization.name,
                  "legalName": seoConfig.organization.legalName,
                  "url": seoConfig.baseUrl,
                  "logo": {
                    "@type": "ImageObject",
                    "url": seoConfig.organization.logo,
                    "width": 512,
                    "height": 512,
                  },
                  "description": seoConfig.siteDescription,
                  "foundingDate": "2024",
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": seoConfig.organization.addressLocality,
                    "addressRegion": seoConfig.organization.addressRegion,
                    "addressCountry": seoConfig.organization.addressCountry,
                  },
                  "sameAs": [
                    seoConfig.social.twitter,
                    seoConfig.social.linkedin,
                    seoConfig.social.instagram,
                  ],
                  "founder": seoConfig.founders.map(f => ({
                    "@type": "Person",
                    "name": f.name,
                    "jobTitle": f.role,
                    "sameAs": [f.linkedin],
                  })),
                  "subOrganization": seoConfig.ventures.map(name => ({
                    "@type": "Organization",
                    "name": name,
                    "@id": `${seoConfig.baseUrl}/#venture-${name.toLowerCase().replace(/\s+/g, "-")}`,
                  })),
                },
                {
                  "@type": "WebSite",
                  "@id": `${seoConfig.baseUrl}/#website`,
                  "url": seoConfig.baseUrl,
                  "name": seoConfig.siteName,
                  "publisher": { "@id": `${seoConfig.baseUrl}/#organization` },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${seoConfig.baseUrl}/ecosystem?search={search_term_string}`,
                    "query-input": "required name=search_term_string"
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col selection:bg-white/20">
        {/* Static overlay — in the initial server HTML, covers everything
            from byte one. CSS rule hides it instantly for returning visitors. */}
        <div
          id="intro-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: '#0a0a0a',
            zIndex: 9999,
          }}
          suppressHydrationWarning
        />
        <LayoutClient>{children}</LayoutClient>
        <BackendWakeUp />
      </body>
    </html>
  );
}
