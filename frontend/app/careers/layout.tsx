import type { Metadata } from "next";
import { buildTitle, buildOgMetadata, buildTwitterMetadata, canonicalUrl } from "@/lib/seo";

const title = buildTitle("Startup Jobs & Careers");
const description =
  "Find exciting startup jobs, internships, and remote roles within the DevUp Ecosystem. Join our portfolio companies and build the future.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: buildOgMetadata({
    title,
    description,
    path: "/careers",
  }),
  twitter: buildTwitterMetadata({ title, description }),
  alternates: {
    canonical: canonicalUrl("/careers"),
  },
};

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

