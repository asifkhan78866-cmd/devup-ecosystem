import type { Metadata } from "next";
import { buildOgMetadata, buildTwitterMetadata, canonicalUrl } from "@/lib/seo";
import ContentPage, { H2, P, FaqBlock, CTA } from "@/components/seo/ContentPage";

const CONTACT_EMAIL = "devupecosystem@gmail.com";
const DECK_MAILTO = `mailto:${CONTACT_EMAIL}?subject=DEVTHON%202026%20Sponsorship%20Deck%20Request`;

const title = "Sponsor DEVTHON 2026 — Hackathon Sponsorship";
const description =
  "Sponsor DEVTHON 2026, a national campus hackathon by DevUp Ecosystem in Hyderabad. Reach 2,000+ student innovators from 100+ colleges with 2.5 lakh+ digital impressions. Platinum, Gold & Silver partner tiers — request the sponsorship deck.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "hackathon sponsorship",
    "hackathon sponsorship India",
    "sponsor a hackathon",
    "student event sponsorship",
    "campus hackathon sponsor",
    "brand partnership hackathon",
    "tech event sponsorship Hyderabad",
    "recruit engineering students",
    "campus recruitment India",
    "DEVTHON sponsorship",
  ],
  alternates: { canonical: canonicalUrl("/sponsors") },
  openGraph: buildOgMetadata({ title, description, path: "/sponsors" }),
  twitter: buildTwitterMetadata({ title, description }),
};

const STATS: { value: string; label: string }[] = [
  { value: "2,000+", label: "student participants" },
  { value: "100+", label: "colleges across India" },
  { value: "2.5 Lakh+", label: "digital reach" },
  { value: "200+", label: "teams for hiring & internships" },
  { value: "36 hrs", label: "national build sprint" },
  { value: "Multi-state", label: "geographic diversity" },
];

/* Sponsorship tiers — pricing intentionally withheld (request the deck). */
const TIERS: { name: string; partnerTitle: string; highlight?: boolean; blurb: string }[] = [
  {
    name: "Platinum",
    partnerTitle: "Industry / Knowledge Partner",
    highlight: true,
    blurb: "Top-tier positioning across the entire event — opening keynote slot, brand video in the opening & closing ceremony, main-stage branding, prime physical placement, priority talent access, and a startup/brand case-study feature.",
  },
  {
    name: "Gold",
    partnerTitle: "Associate Partner",
    blurb: "Strong brand presence — a panel/session speaking slot, logo on main-stage backdrops and HD screens, standard digital promotions, a booth/experience zone, and standard talent-discovery access.",
  },
  {
    name: "Silver",
    partnerTitle: "Supporting Partner",
    blurb: "Event-level recognition — logo on the official website, registration portal, participant & winner certificates, posters and collaterals, plus social promotions and post-event ecosystem access.",
  },
];

/* Benefits matrix, transcribed from the DEVTHON sponsorship deck. */
const MATRIX_ROWS: { feature: string; platinum: string; gold: string; silver: string }[] = [
  { feature: "Official partner title", platinum: "Industry / Knowledge Partner", gold: "Associate Partner", silver: "Supporting Partner" },
  { feature: "Leadership visibility & recognition", platinum: "Top-tier positioning", gold: "Strong presence", silver: "Event-level" },
  { feature: "Keynote / leadership speaking slot", platinum: "Opening / Prime slot", gold: "Panel / Session slot", silver: "—" },
  { feature: "Brand video in opening & closing ceremony", platinum: "✓", gold: "—", silver: "—" },
  { feature: "Logo on main-stage backdrops & HD screens", platinum: "✓", gold: "✓", silver: "—" },
  { feature: "Logo on official website & registration portal", platinum: "✓", gold: "✓", silver: "✓" },
  { feature: "Logo on participant & winner certificates (2,000+)", platinum: "✓", gold: "✓", silver: "✓" },
  { feature: "Digital promotions (reels, creatives, mentions)", platinum: "Premium & Priority", gold: "Standard", silver: "Limited" },
  { feature: "Social media promotions (college + ecosystem)", platinum: "✓", gold: "✓", silver: "✓" },
  { feature: "Logo on posters, flyers & collaterals", platinum: "✓", gold: "✓", silver: "✓" },
  { feature: "Physical branding (banners & standees)", platinum: "Prime locations", gold: "Key locations", silver: "General locations" },
  { feature: "Booth / experience zone at venue", platinum: "✓", gold: "✓", silver: "—" },
  { feature: "Talent discovery & engagement", platinum: "Priority access", gold: "Standard access", silver: "General access" },
  { feature: "Startup / brand case-study feature", platinum: "✓", gold: "—", silver: "—" },
  { feature: "Post-event visibility & ecosystem access", platinum: "✓", gold: "✓", silver: "✓" },
  { feature: "Aggregated engagement insights (non-personal)", platinum: "✓", gold: "✓", silver: "—" },
];

const PARTNERS = [
  "Vidya Jyothi Institute of Technology (VJIT)",
  "Innovation & Entrepreneurship Council (I&EC)",
  "Startups India",
  "DevUp Society",
];

const FAQS = [
  { q: "Why sponsor DEVTHON 2026?", a: "DEVTHON puts your brand in front of 2,000+ high-intent student developers, founders, and innovators from 100+ colleges during an immersive 36-hour national hackathon — with 2.5 lakh+ digital impressions across campus and social channels. It's a cost-efficient way to build brand recall and access a curated talent pipeline for internships and hiring." },
  { q: "What sponsorship tiers are available?", a: "Three tiers: Platinum (Industry/Knowledge Partner), Gold (Associate Partner), and Silver (Supporting Partner). Each unlocks a different level of on-stage, digital, physical, and talent-access benefits. Request the sponsorship deck for the full benefits matrix and current pricing." },
  { q: "Can sponsors recruit or offer internships to participants?", a: "Yes. Talent discovery is a core benefit — sponsors gain access to top-performing teams, demos, and finalists, and can introduce internships, challenges, tools, or hiring opportunities aligned with their goals." },
  { q: "What kind of brand exposure do sponsors get?", a: "Exposure spans the official website and registration portal, participant and winner certificates, main-stage backdrops and screens, posters, standees and venue branding, plus multi-channel digital promotion across Instagram, LinkedIn, X, WhatsApp, and Telegram." },
  { q: "How do we become a sponsor?", a: "Email us to request the full sponsorship deck with tier benefits and pricing. We'll help you choose the tier that fits your goals and budget and finalize the partnership." },
];

export default function SponsorsPage() {
  return (
    <ContentPage
      kicker="PARTNER WITH US · HYDERABAD, INDIA"
      title="Sponsor DEVTHON 2026"
      intro="Empower the next generation of student innovators — and put your brand in front of 2,000+ builders from 100+ colleges across India."
      breadcrumb={[{ name: "Sponsors", path: "/sponsors" }]}
    >
      {/* Traction stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, margin: "8px 0 32px" }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ border: "1px solid #262626", borderRadius: 12, padding: "18px 16px", background: "#0f0f0f" }}>
            <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 26, fontWeight: 800, color: "#c8f135", lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#a1a1a1", marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <H2>Why brands sponsor DEVTHON</H2>
      <P>
        DEVTHON 2026 is a 36-hour national campus hackathon organized by DevUp Ecosystem, hosted at
        Vidya Jyothi Institute of Technology (VJIT), Hyderabad. It brings together thousands of
        high-intent student developers, designers, and founders for real-world problem-solving —
        making it a high-recall, cost-efficient channel to reach India&apos;s emerging tech talent
        and position your brand alongside founders, startups, and emerging technology.
      </P>

      {/* Tier cards */}
      <H2>Sponsorship tiers</H2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, margin: "8px 0 24px" }}>
        {TIERS.map((t) => (
          <div
            key={t.name}
            style={{
              border: t.highlight ? "1px solid #c8f135" : "1px solid #262626",
              borderRadius: 14,
              padding: "22px 20px",
              background: t.highlight ? "rgba(200,241,53,0.06)" : "#0f0f0f",
            }}
          >
            <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 22, fontWeight: 800, color: t.highlight ? "#c8f135" : "#fff" }}>{t.name}</div>
            <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, color: "#a1a1a1", margin: "6px 0 12px", textTransform: "uppercase", letterSpacing: 0.5 }}>{t.partnerTitle}</div>
            <p style={{ fontSize: 14, color: "#a1a1a1", lineHeight: 1.65 }}>{t.blurb}</p>
          </div>
        ))}
      </div>
      <P>
        Pricing is shared in the sponsorship deck so we can recommend the right fit for your goals
        and budget. Custom and in-kind partnerships are also welcome.
      </P>

      {/* Benefits matrix */}
      <H2>Benefits at a glance</H2>
      <div style={{ overflowX: "auto", margin: "8px 0 8px", border: "1px solid #262626", borderRadius: 12 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 620, fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#0f0f0f" }}>
              <th style={{ textAlign: "left", padding: "12px 14px", color: "#a1a1a1", fontWeight: 600, borderBottom: "1px solid #262626" }}>Benefit</th>
              <th style={{ textAlign: "center", padding: "12px 14px", color: "#c8f135", fontWeight: 700, borderBottom: "1px solid #262626" }}>Platinum</th>
              <th style={{ textAlign: "center", padding: "12px 14px", color: "#fff", fontWeight: 700, borderBottom: "1px solid #262626" }}>Gold</th>
              <th style={{ textAlign: "center", padding: "12px 14px", color: "#fff", fontWeight: 700, borderBottom: "1px solid #262626" }}>Silver</th>
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map((r, i) => (
              <tr key={r.feature} style={{ background: i % 2 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                <td style={{ padding: "11px 14px", color: "#d4d4d4", borderBottom: "1px solid #1a1a1a" }}>{r.feature}</td>
                <td style={{ padding: "11px 14px", color: r.platinum === "✓" ? "#c8f135" : "#a1a1a1", textAlign: "center", borderBottom: "1px solid #1a1a1a" }}>{r.platinum}</td>
                <td style={{ padding: "11px 14px", color: r.gold === "✓" ? "#c8f135" : "#a1a1a1", textAlign: "center", borderBottom: "1px solid #1a1a1a" }}>{r.gold}</td>
                <td style={{ padding: "11px 14px", color: r.silver === "✓" ? "#c8f135" : "#a1a1a1", textAlign: "center", borderBottom: "1px solid #1a1a1a" }}>{r.silver}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Backed by a strong ecosystem</H2>
      <P>DEVTHON is delivered in partnership with leading institutions and innovation bodies:</P>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "4px 0 8px" }}>
        {PARTNERS.map((p) => (
          <span key={p} style={{ fontSize: 13, color: "#d4d4d4", border: "1px solid #262626", borderRadius: 999, padding: "8px 16px" }}>{p}</span>
        ))}
      </div>

      <H2>Sponsorship FAQ</H2>
      <FaqBlock faqs={FAQS} />

      {/* CTA — request the deck (no public pricing) */}
      <div style={{ marginTop: 32, padding: 24, background: "#0f0f0f", border: "1px solid #262626", borderRadius: 14 }}>
        <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
          Request the sponsorship deck
        </p>
        <p style={{ fontSize: 15, color: "#a1a1a1", lineHeight: 1.7, marginBottom: 16 }}>
          Get the full tier benefits, pricing, and reach breakdown. We&apos;ll help you pick the
          right partnership for your goals.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href={DECK_MAILTO} style={{ background: "#c8f135", color: "#000", padding: "13px 26px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", display: "inline-block" }}>
            Request sponsorship deck
          </a>
          <CTA href="/contact" label="Contact the team" primary={false} />
        </div>
      </div>
    </ContentPage>
  );
}
