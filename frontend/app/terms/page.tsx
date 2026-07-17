import type { Metadata } from "next";
import { buildOgMetadata, buildTwitterMetadata, canonicalUrl, seoConfig } from "@/lib/seo";
import ContentPage, { H2, P, UL } from "@/components/seo/ContentPage";

const title = "Terms & Conditions";
const description =
  "The terms and conditions governing your use of devupecosystem.com and participation in DEVTHON hackathons — eligibility, intellectual property, conduct, and liability.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl("/terms") },
  openGraph: buildOgMetadata({ title, description, path: "/terms" }),
  twitter: buildTwitterMetadata({ title, description }),
};

export default function TermsPage() {
  return (
    <ContentPage
      kicker="LEGAL"
      title="Terms & Conditions"
      intro={`The terms governing your use of ${seoConfig.siteName} and participation in DEVTHON.`}
      breadcrumb={[{ name: "Terms & Conditions", path: "/terms" }]}
      lastUpdated="18 July 2026"
    >
      <P>
        These Terms &amp; Conditions govern your access to and use of devupecosystem.com and
        participation in DEVTHON and other {seoConfig.siteName} events. By using our website or
        registering, you agree to these terms.
      </P>

      <H2>Eligibility</H2>
      <P>
        DEVTHON is open to students, developers, designers, and founders as described on the event
        pages. You are responsible for ensuring the accuracy of the information you provide during
        registration.
      </P>

      <H2>Participant conduct</H2>
      <UL
        items={[
          "Submit only original work that you have the right to use",
          "Do not engage in plagiarism, cheating, or misrepresentation",
          "Respect other participants, mentors, judges, and organizers",
          "Follow the DEVTHON Code of Conduct at all times",
        ]}
      />

      <H2>Intellectual property</H2>
      <P>
        You retain ownership of the projects and ideas you create at DEVTHON. By participating, you
        grant {seoConfig.siteName} a non-exclusive right to showcase your project name, team, and
        summary for promotional and archival purposes. Any incubation, investment, or partnership
        arrangements are handled separately through mutual written agreement.
      </P>

      <H2>Prizes, internships & incubation</H2>
      <P>
        Prizes, internships, placements, and incubation opportunities are awarded at the discretion
        of {seoConfig.siteName} and its partners, subject to eligibility and verification. Specific
        terms for each opportunity are communicated to selected participants.
      </P>

      <H2>Limitation of liability</H2>
      <P>
        Our services are provided &quot;as is&quot;. To the maximum extent permitted by law,
        {" "}{seoConfig.siteName} is not liable for indirect or consequential damages arising from
        your use of the website or participation in events.
      </P>

      <H2>Changes to these terms</H2>
      <P>
        We may update these terms from time to time. Continued use of the website after changes are
        posted constitutes acceptance of the updated terms.
      </P>

      <H2>Contact</H2>
      <P>Questions about these terms? Email devupecosystem@gmail.com.</P>
    </ContentPage>
  );
}
