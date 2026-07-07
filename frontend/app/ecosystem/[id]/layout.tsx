import { Metadata } from "next";
import { seoConfig, buildOgMetadata, buildTwitterMetadata, canonicalUrl } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getStartup(id: string) {
  try {
    const res = await fetch(`${API}/api/startups/${id}`, { cache: "no-store" });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const startup = await getStartup(id);

  if (!startup) {
    return {
      title: "Venture | DevUp Ecosystem",
      description: "Explore the ventures and startups built within the DevUp Ecosystem.",
    };
  }

  const title = `${startup.name} — Venture of DevUp Ecosystem`;
  const description = `${startup.name} is a ${startup.domain || "Tech"} venture of the DevUp Ecosystem, focusing on ${startup.tagline || "innovation"}. Explore how we're building innovation together.`;
  const path = `/ecosystem/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(path),
    },
    openGraph: buildOgMetadata({
      title,
      description,
      path,
      image: startup.logoUrl || startup.bannerUrl || undefined,
      imageAlt: `${startup.name} — DevUp Ecosystem Venture`,
    }),
    twitter: buildTwitterMetadata({
      title,
      description,
      image: startup.logoUrl || startup.bannerUrl || undefined,
    }),
  };
}

export default async function StartupLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const { id } = await params;
  let startup = null;
  try {
    const res = await fetch(`${API}/api/startups/${id}`, { cache: "no-store" });
    const data = await res.json();
    if (data.success && data.data) {
      startup = data.data;
    }
  } catch (e) {
    // ignore
  }

  return (
    <>
      {startup && (
        <>
          <JsonLd data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": startup.name,
            "description": startup.tagline || startup.description,
            "url": `${seoConfig.baseUrl}/ecosystem/${startup.id}`,
            "parentOrganization": {
              "@type": "Organization",
              "@id": `${seoConfig.baseUrl}/#organization`,
              "name": seoConfig.organization.name,
              "url": seoConfig.baseUrl
            }
          }} />
          <BreadcrumbJsonLd items={[
            { name: "Ventures", path: "/ecosystem" },
            { name: startup.name, path: `/ecosystem/${id}` },
          ]} />
        </>
      )}
      {children}
    </>
  );
}

