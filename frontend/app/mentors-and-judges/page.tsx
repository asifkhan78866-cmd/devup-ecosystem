import type { Metadata } from "next";
import { buildOgMetadata, buildTwitterMetadata, canonicalUrl } from "@/lib/seo";
import ContentPage, { H2, P, UL, FaqBlock, CTA } from "@/components/seo/ContentPage";

const CONTACT_EMAIL = "devupecosystem@gmail.com";
const MENTOR_MAILTO = `mailto:${CONTACT_EMAIL}?subject=DEVTHON%202026%20Mentor%20/%20Judge%20Application`;

const title = "Mentors & Judges — DEVTHON 2026";
const description =
  "Become a mentor or judge at DEVTHON 2026, a national campus hackathon by DevUp Ecosystem in Hyderabad. Guide 2,000+ student innovators, evaluate real-world projects, and shape India's next generation of builders. Apply now.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "hackathon mentor",
    "hackathon judge",
    "become a hackathon mentor",
    "hackathon judge application",
    "mentor students India",
    "tech mentor Hyderabad",
    "hackathon jury",
    "industry mentor program",
    "DEVTHON mentors",
    "DEVTHON judges",
  ],
  alternates: { canonical: canonicalUrl("/mentors-and-judges") },
  openGraph: buildOgMetadata({ title, description, path: "/mentors-and-judges" }),
  twitter: buildTwitterMetadata({ title, description }),
};

const FAQS = [
  { q: "Who can be a mentor or judge at DEVTHON?", a: "We welcome founders, engineers, designers, product leaders, researchers, domain experts, and investors with experience across any of DEVTHON's 36 innovation domains. Both industry professionals and experienced academics are encouraged to apply." },
  { q: "What does a DEVTHON mentor do?", a: "Mentors guide teams during the hackathon — helping them scope their idea, unblock technical challenges, sharpen their pitch, and think about real-world impact. Mentorship can be on-ground in Hyderabad or online, based on your availability." },
  { q: "What does a DEVTHON judge do?", a: "Judges evaluate team demos and pitches against DEVTHON's criteria — innovation, impact, technical execution, design, and viability — and help select the winning teams. Judging typically happens during the grand finale." },
  { q: "How much time does it take?", a: "It's flexible. Mentors can commit a few hours during the build phase; judges typically commit to the evaluation and finale window. We'll share the exact schedule when you're onboarded." },
  { q: "How do I apply to be a mentor or judge?", a: "Email us with a short note about your background and the domains you'd like to support. Our team reviews applications on a rolling basis and will follow up with next steps." },
];

export default function MentorsJudgesPage() {
  return (
    <ContentPage
      kicker="GET INVOLVED · MENTORS & JUDGES"
      title="Mentors & Judges at DEVTHON 2026"
      intro="Shape India's next generation of builders. Guide teams, evaluate real-world projects, and lend your expertise to a national innovation hackathon."
      breadcrumb={[{ name: "Mentors & Judges", path: "/mentors-and-judges" }]}
    >
      <P>
        DEVTHON 2026 brings together 2,000+ student developers, designers, and founders from 100+
        colleges across India for a 36-hour national build sprint. Behind every strong team is a
        mentor who unblocked them and a judge who challenged them to think bigger. If you have
        experience to share, we&apos;d love to have you on board.
      </P>

      <H2>Become a mentor</H2>
      <P>
        Mentors are the heartbeat of DEVTHON. You&apos;ll work directly with motivated teams,
        helping them turn a rough idea into a working, well-pitched solution.
      </P>
      <UL
        items={[
          "Help teams scope their idea and choose the right approach",
          "Unblock technical, design, or product challenges in real time",
          "Sharpen pitches and push teams to think about real-world impact",
          "Mentor on-ground in Hyderabad or online — whatever suits you",
        ]}
      />

      <H2>Join the judging panel</H2>
      <P>
        Judges bring rigor and credibility to DEVTHON. You&apos;ll evaluate demos and pitches and
        help decide which teams take home the top honours.
      </P>
      <UL
        items={[
          "Evaluate projects on innovation, impact, execution, design, and viability",
          "Review live demos and team pitches at the grand finale",
          "Provide constructive feedback that helps participants grow",
          "Help select winners for prizes, internships, and incubation",
        ]}
      />

      <H2>Why mentor or judge at DEVTHON?</H2>
      <UL
        items={[
          "Give back and directly shape emerging talent across India",
          "Discover standout students for internships, hiring, or collaboration",
          "Expand your network among founders, industry leaders, and investors",
          "Official recognition as a DEVTHON mentor or judge across event platforms",
          "Association with a national innovation hackathon and the DevUp Ecosystem",
        ]}
      />

      <H2>Domains we need expertise in</H2>
      <P>
        We&apos;re looking for mentors and judges across all 36 DEVTHON innovation domains —
        including Artificial Intelligence &amp; Machine Learning, Generative AI, Cybersecurity,
        Blockchain, Cloud &amp; DevOps, IoT, Robotics, HealthTech, FinTech, EdTech, AgriTech,
        ClimateTech, and SpaceTech. Bring your niche; there&apos;s a team that needs exactly what
        you know.
      </P>

      <H2>Mentor &amp; judge FAQ</H2>
      <FaqBlock faqs={FAQS} />

      <div style={{ marginTop: 32, padding: 24, background: "#0f0f0f", border: "1px solid #262626", borderRadius: 14 }}>
        <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
          Apply to mentor or judge
        </p>
        <p style={{ fontSize: 15, color: "#a1a1a1", lineHeight: 1.7, marginBottom: 16 }}>
          Send us a short note about your background and the domains you&apos;d like to support.
          We review applications on a rolling basis.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href={MENTOR_MAILTO} style={{ background: "#c8f135", color: "#000", padding: "13px 26px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", display: "inline-block" }}>
            Apply now
          </a>
          <CTA href="/hackathons" label="Explore DEVTHON 2026" primary={false} />
        </div>
      </div>
    </ContentPage>
  );
}
