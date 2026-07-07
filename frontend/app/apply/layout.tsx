import type { Metadata } from "next";
import { buildTitle, buildOgMetadata, buildTwitterMetadata, canonicalUrl } from "@/lib/seo";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

const title = buildTitle("Apply to Cohort 4");
const description =
  "Apply to DevUp Ecosystem Cohort 4 — a 12-week accelerator for student founders in India. Get up to ₹50 Lakhs funding, mentorship, and $100k+ in partner credits.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalUrl("/apply"),
  },
  openGraph: buildOgMetadata({
    title,
    description,
    path: "/apply",
  }),
  twitter: buildTwitterMetadata({ title, description }),
};

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Apply", path: "/apply" }]} />
      {children}
    </>
  );
}
