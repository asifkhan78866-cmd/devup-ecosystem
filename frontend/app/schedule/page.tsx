import type { Metadata } from "next";
import { buildOgMetadata, buildTwitterMetadata, canonicalUrl } from "@/lib/seo";
import ContentPage, { H2, P, CTA } from "@/components/seo/ContentPage";

const title = "DEVTHON 2026 Schedule & Timeline";
const description =
  "The full DEVTHON 2026 schedule and timeline — registration, idea submission (Phase 1), the 36-hour offline hackathon (Phase 2), judging, and the grand finale. Plan your national innovation hackathon journey.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "DEVTHON schedule",
    "hackathon timeline",
    "hackathon 2026 dates",
    "hackathon phases",
    "36 hour hackathon",
    "hackathon agenda India",
  ],
  alternates: { canonical: canonicalUrl("/schedule") },
  openGraph: buildOgMetadata({ title, description, path: "/schedule" }),
  twitter: buildTwitterMetadata({ title, description }),
};

const PHASES = [
  { tag: "PHASE 0", title: "Registration Opens", when: "Now – Registration deadline", detail: "Free online registration. Form your team of up to 4, choose from 36 innovation domains, and secure your spot." },
  { tag: "PHASE 1", title: "Idea & Abstract Submission", when: "Online", detail: "Submit a one-page abstract or pitch deck outlining the problem you're solving and your proposed approach. Shortlisted teams advance to Phase 2." },
  { tag: "PHASE 2", title: "36-Hour Offline Hackathon", when: "Grand finale · Hyderabad", detail: "Selected teams build, code, and pitch their solution in a non-stop 36-hour innovation sprint with mentor support, workshops, and networking." },
  { tag: "PHASE 3", title: "Judging & Demos", when: "Grand finale", detail: "Teams present to a panel of industry experts, founders, and investors. Solutions are evaluated on innovation, impact, execution, and viability." },
  { tag: "PHASE 4", title: "Awards, Internships & Incubation", when: "Grand finale", detail: "Winners receive prizes, and standout participants earn internship offers, placement opportunities, and startup incubation within DevUp Ecosystem." },
];

export default function SchedulePage() {
  return (
    <ContentPage
      kicker="EVENT · TIMELINE"
      title="DEVTHON 2026 Schedule & Timeline"
      intro="DEVTHON runs in clear phases so every team knows exactly what to expect — from your first registration to the grand finale in Hyderabad."
      breadcrumb={[{ name: "Schedule", path: "/schedule" }]}
    >
      <P>
        DEVTHON 2026 is structured as a multi-phase national innovation hackathon. Online phases
        make it easy to participate from anywhere in India, while the grand finale brings finalists
        together for a 36-hour offline sprint in Hyderabad, Telangana.
      </P>

      <div style={{ margin: "28px 0" }}>
        {PHASES.map((p) => (
          <div key={p.tag} style={{ display: "flex", gap: 18, padding: "20px 0", borderBottom: "1px solid #262626" }}>
            <div style={{ minWidth: 84 }}>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12, color: "#c8f135" }}>{p.tag}</span>
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{p.title}</h3>
              <p style={{ fontSize: 13, color: "#737373", marginBottom: 8 }}>{p.when}</p>
              <p style={{ fontSize: 15, color: "#a1a1a1", lineHeight: 1.7 }}>{p.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <H2>Exact dates</H2>
      <P>
        Precise dates for DEVTHON 2026 are announced on the hackathon page and shared with
        registered participants by email. Register now to lock in your spot and get every update
        first.
      </P>

      <div style={{ marginTop: 24 }}>
        <CTA href="/hackathons" label="Register for DEVTHON 2026" />
      </div>
    </ContentPage>
  );
}
