import type { Metadata } from "next";
import { buildTitle, buildOgMetadata, buildTwitterMetadata, canonicalUrl } from "@/lib/seo";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

const title = buildTitle("Build With DevUp");
const description =
  "Partner with DevUp Ecosystem for tech, AI, design, marketing, legal, and strategy services. We help student startups build, launch, and scale with expert support.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalUrl("/build-with-devup"),
  },
  openGraph: buildOgMetadata({
    title,
    description,
    path: "/build-with-devup",
  }),
  twitter: buildTwitterMetadata({ title, description }),
};

export default function BuildWithDevUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Build With DevUp", path: "/build-with-devup" }]} />
      {children}
    </>
  );
}
