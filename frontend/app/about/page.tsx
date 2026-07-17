import type { Metadata } from "next";
import { buildOgMetadata, buildTwitterMetadata, canonicalUrl, seoConfig } from "@/lib/seo";
import ContentPage, { H2, P, UL, CTA } from "@/components/seo/ContentPage";

const title = "About DEVTHON & DevUp Ecosystem";
const description =
  "DEVTHON is a national innovation hackathon by DevUp Ecosystem, based in Hyderabad, Telangana. Learn about our mission to build one of India's most ambitious innovation, entrepreneurship, and incubation ecosystems for students and startups.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "About DEVTHON",
    "DevUp Ecosystem",
    "national innovation hackathon India",
    "innovation ecosystem Hyderabad",
    "student startup ecosystem India",
    "who organizes DEVTHON",
    "DevUp Ecosystem founders",
  ],
  alternates: { canonical: canonicalUrl("/about") },
  openGraph: buildOgMetadata({ title, description, path: "/about" }),
  twitter: buildTwitterMetadata({ title, description }),
};

export default function AboutPage() {
  return (
    <ContentPage
      kicker="ABOUT · HYDERABAD, INDIA"
      title="About DEVTHON & DevUp Ecosystem"
      intro="DEVTHON is building one of India's most ambitious innovation ecosystems — where students, developers, and founders turn ideas into real ventures through hackathons, incubation, mentorship, and opportunity."
      breadcrumb={[{ name: "About", path: "/about" }]}
    >
      <H2>Who we are</H2>
      <P>
        DevUp Ecosystem is a student-driven innovation and startup ecosystem headquartered in
        Hyderabad, Telangana, India. We exist to close the gap between talented students and
        real-world outcomes — internships, placements, funding, and startup incubation. DEVTHON,
        our flagship national innovation hackathon, is the front door to that ecosystem.
      </P>
      <P>
        Where a traditional hackathon ends at a demo, DEVTHON begins. Winning teams and standout
        participants gain access to paid internships, placement opportunities with hiring partners,
        startup incubation support, and direct mentorship from founders, engineers, and investors.
      </P>

      <H2>Our mission</H2>
      <P>
        India produces the world&apos;s largest pool of student engineers, yet too much of that
        talent never reaches its potential for lack of a stage, mentorship, or a path to
        opportunity. Our mission is to build the innovation infrastructure that changes this —
        starting in Hyderabad and scaling across every Indian state.
      </P>

      <H2>What DEVTHON offers</H2>
      <UL
        items={[
          "A national-level innovation hackathon across 36 innovation domains",
          "Startup incubation for promising teams and early founders",
          "Paid internship and placement opportunities with hiring partners",
          "Mentorship from industry leaders, engineers, and investors",
          "A Campus Ambassador program that empowers students to lead on their campus",
          "A growing community of developers, designers, entrepreneurs, and researchers",
        ]}
      />

      <H2>The DevUp Ecosystem</H2>
      <P>
        Beyond DEVTHON, DevUp Ecosystem incubates and builds a portfolio of student ventures —
        including {seoConfig.ventures.join(", ")} — spanning AI, consumer, and developer products.
        This gives DEVTHON participants a living example of what their own ideas can become.
      </P>

      <H2>Leadership</H2>
      <P>
        DevUp Ecosystem was founded by {seoConfig.founders.map((f) => `${f.name} (${f.role})`).join(" and ")}.
        The team combines engineering, product, and community-building experience with a deep
        commitment to India&apos;s student innovators.
      </P>

      <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
        <CTA href="/hackathons" label="Explore DEVTHON 2026" />
        <CTA href="/ecosystem" label="See our ventures" primary={false} />
      </div>
    </ContentPage>
  );
}
