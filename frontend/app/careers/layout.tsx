import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Startup Jobs & Careers | DevUp Ecosystem",
  description: "Find exciting startup jobs, internships, and remote roles within the DevUp Ecosystem. Join our portfolio companies and build the future.",
  openGraph: {
    title: "Startup Jobs & Careers | DevUp Ecosystem",
    description: "Find exciting startup jobs, internships, and remote roles within the DevUp Ecosystem. Join our portfolio companies and build the future.",
    url: "https://www.devupecosystem.com/careers",
    type: "website",
  },
  alternates: {
    canonical: "https://www.devupecosystem.com/careers",
  },
};

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
