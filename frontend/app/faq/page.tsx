import type { Metadata } from "next";
import { buildOgMetadata, buildTwitterMetadata, canonicalUrl } from "@/lib/seo";
import ContentPage, { FaqBlock, CTA } from "@/components/seo/ContentPage";

const title = "DEVTHON Hackathon FAQ";
const description =
  "Answers to the most common questions about DEVTHON 2026 — registration, eligibility, team size, fees, prizes, internships, placements, venue in Hyderabad, online participation, and more.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "DEVTHON FAQ",
    "hackathon registration India",
    "how to register for hackathon",
    "hackathon eligibility",
    "hackathon team size",
    "free hackathon India",
    "hackathon prizes",
    "hackathon with internship",
    "hackathon Hyderabad venue",
  ],
  alternates: { canonical: canonicalUrl("/faq") },
  openGraph: buildOgMetadata({ title, description, path: "/faq" }),
  twitter: buildTwitterMetadata({ title, description }),
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is DEVTHON?",
    a: "DEVTHON is a national innovation hackathon organized by DevUp Ecosystem, based in Hyderabad, Telangana. It brings together developers, designers, entrepreneurs, students, mentors, recruiters, and investors to build solutions across 36 innovation domains. Beyond the build sprint, DEVTHON offers startup incubation, paid internships, and placement opportunities.",
  },
  {
    q: "Who can participate in DEVTHON 2026?",
    a: "DEVTHON is open to students, developers, designers, researchers, and early founders from any college or university across India. Participants typically range from first-year students to final-year engineers and recent graduates. Both individuals and teams are welcome.",
  },
  {
    q: "How do I register for DEVTHON?",
    a: "Registration is free and done online. Visit the DEVTHON hackathons page, choose your innovation track, and register your team of up to four members. You can register as an individual and form or join a team later.",
  },
  {
    q: "Is DEVTHON free to participate in?",
    a: "Yes. Registration for DEVTHON is free. There are no hidden fees to enter the hackathon and compete for prizes, internships, and incubation opportunities.",
  },
  {
    q: "What is the team size for DEVTHON?",
    a: "Teams can have up to four members. Solo participants are also welcome and can team up with others before the event begins.",
  },
  {
    q: "Can I participate online, or is it only offline in Hyderabad?",
    a: "DEVTHON supports both online participation and an on-ground grand finale. Teams from anywhere in India can take part online, while finalists are invited to the offline finale hosted in Hyderabad.",
  },
  {
    q: "What can I win at DEVTHON?",
    a: "DEVTHON offers a growing prize pool, paid internships with monthly stipends, startup incubation support, and networking with recruiters and investors. Standout participants gain a direct path to internships and placements with hiring partners.",
  },
  {
    q: "What innovation domains can I compete in?",
    a: "DEVTHON spans 36 innovation domains including Artificial Intelligence & Machine Learning, Generative AI, Cybersecurity, Cloud & DevOps, Blockchain & Web3, IoT, Robotics, HealthTech, FinTech, EdTech, AgriTech, ClimateTech, SpaceTech, AR/VR, Quantum Computing, and more. See the full list on the Domains page.",
  },
  {
    q: "Do I need to be an experienced coder to join?",
    a: "No. DEVTHON welcomes participants at every level — from first-time hackers to experienced engineers. Mentors are available to guide teams, and beginner-friendly tracks and resources help you get started.",
  },
  {
    q: "Will I get a certificate for participating?",
    a: "Yes. All participants receive a certificate of participation, and winners receive additional recognition, prizes, and opportunities within the DevUp Ecosystem.",
  },
  {
    q: "How can my college get involved?",
    a: "Students can join the DEVTHON Campus Ambassador program to lead participation from their college, earn rewards, and gain leadership experience. Colleges and universities can also partner with DevUp Ecosystem to host or promote the hackathon.",
  },
  {
    q: "Who organizes DEVTHON?",
    a: "DEVTHON is organized by DevUp Ecosystem, a student-driven innovation and startup ecosystem based in Hyderabad, Telangana, India.",
  },
];

export default function FaqPage() {
  return (
    <ContentPage
      kicker="HELP · FREQUENTLY ASKED QUESTIONS"
      title="DEVTHON Hackathon — FAQ"
      intro="Everything you need to know about DEVTHON 2026 — registration, eligibility, prizes, internships, and how to take part from anywhere in India."
      breadcrumb={[{ name: "FAQ", path: "/faq" }]}
    >
      <FaqBlock faqs={FAQS} />

      <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
        <CTA href="/hackathons" label="Register for DEVTHON 2026" />
        <CTA href="/contact" label="Still have questions? Contact us" primary={false} />
      </div>
    </ContentPage>
  );
}
