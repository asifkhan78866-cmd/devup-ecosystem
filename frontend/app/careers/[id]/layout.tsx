import { Metadata } from "next";
import { seoConfig, buildOgMetadata, buildTwitterMetadata, canonicalUrl } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getJob(id: string) {
  try {
    const res = await fetch(`${API}/api/jobs/${id}`, { cache: "no-store" });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

/** Map internal job types to Schema.org employmentType values */
function mapEmploymentType(type: string): string {
  const map: Record<string, string> = {
    FULL_TIME: "FULL_TIME",
    PART_TIME: "PART_TIME",
    INTERNSHIP: "INTERN",
    CONTRACT: "CONTRACTOR",
  };
  return map[type] || "OTHER";
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return {
      title: "Job Not Found | DevUp Ecosystem",
      description: "This job posting could not be found. Browse all available opportunities on the DevUp Ecosystem careers page.",
    };
  }

  const companyName = job.startup?.name || "DevUp";
  const title = `${job.title} at ${companyName} | DevUp Ecosystem`;
  const description = job.description
    ? job.description.slice(0, 160).replace(/\n/g, " ").trim() + (job.description.length > 160 ? "…" : "")
    : `Apply for ${job.title} at ${companyName}. Explore startup opportunities in the DevUp Ecosystem.`;
  const path = `/careers/${id}`;

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
      image: job.startup?.logoUrl || undefined,
      imageAlt: `${job.title} at ${companyName} — DevUp Ecosystem`,
    }),
    twitter: buildTwitterMetadata({
      title,
      description,
      image: job.startup?.logoUrl || undefined,
    }),
  };
}

export default async function JobDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);

  return (
    <>
      {job && (
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "JobPosting",
              title: job.title,
              description: job.description,
              datePosted: job.createdAt,
              employmentType: mapEmploymentType(job.type),
              jobLocation: {
                "@type": "Place",
                address: {
                  "@type": "PostalAddress",
                  addressLocality: job.location,
                  addressCountry: "IN",
                },
              },
              ...(job.isRemote && {
                jobLocationType: "TELECOMMUTE",
              }),
              hiringOrganization: {
                "@type": "Organization",
                name: job.startup?.name || "DevUp Ecosystem",
                sameAs: `${seoConfig.baseUrl}/ecosystem/${job.startupId}`,
                ...(job.startup?.logoUrl && { logo: job.startup.logoUrl }),
              },
              ...(job.salaryRange && {
                baseSalary: {
                  "@type": "MonetaryAmount",
                  currency: "INR",
                  value: {
                    "@type": "QuantitativeValue",
                    value: job.salaryRange,
                    unitText: "YEAR",
                  },
                },
              }),
            }}
          />
          <BreadcrumbJsonLd
            items={[
              { name: "Careers", path: "/careers" },
              { name: job.title, path: `/careers/${id}` },
            ]}
          />
        </>
      )}
      {children}
    </>
  );
}
