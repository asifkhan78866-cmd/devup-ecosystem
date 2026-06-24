import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Co-Founder Marketplace | DevUp Ecosystem",
  description: "Find the perfect technical or business co-founder for your startup within the DevUp Ecosystem. Connect, build, and grow together.",
  openGraph: {
    title: "Co-Founder Marketplace | DevUp Ecosystem",
    description: "Find the perfect technical or business co-founder for your startup within the DevUp Ecosystem. Connect, build, and grow together.",
    url: "https://www.devupecosystem.com/cofounders",
    type: "website",
  },
  alternates: {
    canonical: "https://www.devupecosystem.com/cofounders",
  },
};

export default function CofoundersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
