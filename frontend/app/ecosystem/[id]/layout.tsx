import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/startups/${id}`, { cache: "no-store" });
    const data = await res.json();
    if (data.success && data.data) {
      const startup = data.data;
      return {
        title: `${startup.name} — Venture of DevUp Ecosystem`,
        description: `${startup.name} is a ${startup.domain || 'Tech'} venture of the DevUp Ecosystem, focusing on ${startup.tagline || 'innovation'}. Explore how we're building innovation together.`,
      };
    }
  } catch (e) {
    console.error("Failed to generate metadata for startup:", e);
  }

  return {
    title: "Venture of DevUp Ecosystem",
    description: "Explore the ventures and companies built within the DevUp Ecosystem.",
  };
}

export default async function StartupLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const { id } = await params;
  let startup = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/startups/${id}`, { cache: "no-store" });
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": startup.name,
              "description": startup.tagline || startup.description,
              "url": `https://www.devupecosystem.com/ecosystem/${startup.id}`,
              "subOrganizationOf": {
                "@type": "Organization",
                "name": "DevUp Ecosystem",
                "url": "https://www.devupecosystem.com"
              }
            })
          }}
        />
      )}
      {children}
    </>
  );
}
