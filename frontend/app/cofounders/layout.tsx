import type { Metadata } from "next";
import { buildTitle, buildOgMetadata, buildTwitterMetadata, canonicalUrl } from "@/lib/seo";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

const title = buildTitle("Co-Founder Marketplace");
const description =
  "Find the perfect technical or business co-founder for your startup within the DevUp Ecosystem. Connect, build, and grow together.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: buildOgMetadata({
    title,
    description,
    path: "/cofounders",
  }),
  twitter: buildTwitterMetadata({ title, description }),
  alternates: {
    canonical: canonicalUrl("/cofounders"),
  },
};

export default function CofoundersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Co-Founders", path: "/cofounders" }]} />
      {children}
    </>
  );
}

