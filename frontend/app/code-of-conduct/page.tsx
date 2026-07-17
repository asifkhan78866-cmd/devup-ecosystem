import type { Metadata } from "next";
import { buildOgMetadata, buildTwitterMetadata, canonicalUrl, seoConfig } from "@/lib/seo";
import ContentPage, { H2, P, UL } from "@/components/seo/ContentPage";

const title = "Code of Conduct";
const description =
  "The DEVTHON Code of Conduct — our commitment to a safe, inclusive, and harassment-free hackathon for every participant, mentor, judge, and volunteer, regardless of background.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl("/code-of-conduct") },
  openGraph: buildOgMetadata({ title, description, path: "/code-of-conduct" }),
  twitter: buildTwitterMetadata({ title, description }),
};

export default function CodeOfConductPage() {
  return (
    <ContentPage
      kicker="COMMUNITY"
      title="DEVTHON Code of Conduct"
      intro="DEVTHON is for everyone. We are committed to a welcoming, safe, and inclusive experience for all participants."
      breadcrumb={[{ name: "Code of Conduct", path: "/code-of-conduct" }]}
      lastUpdated="18 July 2026"
    >
      <P>
        DEVTHON, organized by {seoConfig.siteName}, is dedicated to providing a harassment-free and
        inclusive experience for everyone, regardless of gender, gender identity, sexual
        orientation, disability, physical appearance, body size, race, ethnicity, religion,
        nationality, age, or level of experience.
      </P>

      <H2>Our standards</H2>
      <P>We expect all participants, mentors, judges, sponsors, volunteers, and organizers to:</P>
      <UL
        items={[
          "Be respectful, considerate, and collaborative",
          "Welcome newcomers and support first-time participants",
          "Give and accept constructive feedback graciously",
          "Value diverse perspectives and lived experiences",
          "Keep the event a safe space, both in person and online",
        ]}
      />

      <H2>Unacceptable behavior</H2>
      <UL
        items={[
          "Harassment, intimidation, or discrimination in any form",
          "Offensive or demeaning comments, imagery, or jokes",
          "Unwelcome attention, contact, or messaging",
          "Plagiarism, cheating, or sabotaging other teams",
          "Disruption of talks, workshops, or the event itself",
        ]}
      />

      <H2>Reporting</H2>
      <P>
        If you experience or witness any behavior that violates this Code of Conduct, please report
        it immediately to the organizing team at devupecosystem@gmail.com or to any on-site
        organizer. All reports are handled confidentially and taken seriously.
      </P>

      <H2>Consequences</H2>
      <P>
        Participants asked to stop any unacceptable behavior are expected to comply immediately.
        Organizers may take any action they deem appropriate, including warning, disqualification,
        or removal from the event without refund, and, where relevant, involving local authorities.
      </P>

      <H2>Scope</H2>
      <P>
        This Code of Conduct applies to all DEVTHON spaces — venues, online platforms, communication
        channels, and associated social events.
      </P>
    </ContentPage>
  );
}
