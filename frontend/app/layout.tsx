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
                  "@id": "https://www.devupecosystem.com/#organization",
                  "name": "DevUp Ecosystem",
                  "url": "https://www.devupecosystem.com",
                  "logo": "https://www.devupecosystem.com/icon.png",
                  "description": "Innovation hub for startups, hackathons, and builders",
                  "sameAs": [
                    "https://twitter.com/devupeco",
                    "https://linkedin.com/company/devup-ecosystem"
                  ],
                  "subOrganization": [
                    { "@type": "Organization", "name": "Yarnia" },
                    { "@type": "Organization", "name": "Kroshay" },
                    { "@type": "Organization", "name": "Elnora" },
                    { "@type": "Organization", "name": "PortalX" },
                    { "@type": "Organization", "name": "Zappy" },
                    { "@type": "Organization", "name": "StartupsIndia" },
                    { "@type": "Organization", "name": "CineShot AI" },
                    { "@type": "Organization", "name": "CourtAI" }
                  ]
                },
                {
                  "@type": "WebSite",
                  "@id": "https://www.devupecosystem.com/#website",
                  "url": "https://www.devupecosystem.com",
                  "name": "DevUp Ecosystem",
                  "publisher": { "@id": "https://www.devupecosystem.com/#organization" },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://www.devupecosystem.com/ecosystem?search={search_term_string}",
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
