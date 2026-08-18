import type { Metadata } from "next";
import { buildTitle, buildOgMetadata, buildTwitterMetadata, canonicalUrl } from "@/lib/seo";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

const pageTitle = "Lead DevUp — Campus, City, Regional & State Director Roles";
// The root layout's title template already appends "| DevUp Ecosystem", so the bare
// page name goes in `title`. buildTitle() is only used for og/twitter, which the
// template does not apply to.
const socialTitle = buildTitle(pageTitle);
const description =
  "Apply to lead the DevUp student community in your campus, city, region or state. Build your own team, host hackathons and founder meets, and get real leadership experience.";

export const metadata: Metadata = {
  title: pageTitle,
  description,
  openGraph: buildOgMetadata({
    title: socialTitle,
    description,
    path: "/lead-devup",
  }),
  twitter: buildTwitterMetadata({ title: socialTitle, description }),
  alternates: {
    canonical: canonicalUrl("/lead-devup"),
  },
};

export default function LeadDevUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Lead DevUp", path: "/lead-devup" }]} />
      {children}
    </>
  );
}
