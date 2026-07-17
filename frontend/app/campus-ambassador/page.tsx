import type { Metadata } from "next";
import { buildOgMetadata, buildTwitterMetadata, canonicalUrl } from "@/lib/seo";
import ContentPage, { H2, P, UL, CTA, FaqBlock } from "@/components/seo/ContentPage";

const title = "Campus Ambassador Program";
const description =
  "Become a DEVTHON Campus Ambassador and lead innovation at your college. Earn certificates, rewards, internship opportunities, and leadership experience while representing India's national innovation hackathon on your campus.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "campus ambassador program",
    "DEVTHON campus ambassador",
    "student ambassador India",
    "college ambassador hackathon",
    "campus leader program",
    "student leadership opportunity",
    "internship for college students",
  ],
  alternates: { canonical: canonicalUrl("/campus-ambassador") },
  openGraph: buildOgMetadata({ title, description, path: "/campus-ambassador" }),
  twitter: buildTwitterMetadata({ title, description }),
};

const FAQS = [
  { q: "Who can become a DEVTHON Campus Ambassador?", a: "Any enthusiastic student currently enrolled in a college or university in India can apply. We look for motivated students who love technology, community-building, and leadership — no prior experience required." },
  { q: "Is the Campus Ambassador program paid?", a: "The program rewards ambassadors with certificates, exclusive swag, performance-based incentives, and priority access to internships and opportunities within DevUp Ecosystem, based on your impact and engagement." },
  { q: "How much time does it take?", a: "It's flexible and fits around your studies. Most ambassadors spend a few hours a week promoting DEVTHON, supporting registrations, and running small campus activities." },
  { q: "What will I gain from it?", a: "Real leadership and marketing experience, a strong addition to your resume, a certificate and letter of recommendation for top performers, networking with founders and recruiters, and a direct line into internships and placements." },
];

export default function CampusAmbassadorPage() {
  return (
    <ContentPage
      kicker="STUDENTS · LEADERSHIP"
      title="DEVTHON Campus Ambassador Program"
      intro="Represent India's national innovation hackathon on your campus. Build leadership skills, grow your network, and unlock internships — while helping fellow students discover DEVTHON."
      breadcrumb={[{ name: "Campus Ambassador", path: "/campus-ambassador" }]}
    >
      <H2>Why become a Campus Ambassador?</H2>
      <UL
        items={[
          "Official certificate and letter of recommendation for top performers",
          "Priority access to internships and placement opportunities at DevUp Ecosystem",
          "Exclusive DEVTHON merchandise and performance-based rewards",
          "Hands-on experience in leadership, marketing, and community-building",
          "Direct networking with founders, mentors, and recruiters",
          "Recognition on DEVTHON platforms for standout ambassadors",
        ]}
      />

      <H2>What you&apos;ll do</H2>
      <UL
        items={[
          "Spread the word about DEVTHON across your college and student networks",
          "Help classmates register and form teams",
          "Host or support small campus activities and info sessions",
          "Share feedback that helps us serve students better",
        ]}
      />

      <H2>How to apply</H2>
      <P>
        Applying is simple and free. Reach out through our contact page or register your interest,
        and our team will guide you through onboarding. Ambassadors from every state and college
        across India are welcome.
      </P>

      <H2>Frequently asked questions</H2>
      <FaqBlock faqs={FAQS} />

      <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
        <CTA href="/contact" label="Apply to be a Campus Ambassador" />
        <CTA href="/hackathons" label="Explore DEVTHON 2026" primary={false} />
      </div>
    </ContentPage>
  );
}
