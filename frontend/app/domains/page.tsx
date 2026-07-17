import type { Metadata } from "next";
import { buildOgMetadata, buildTwitterMetadata, canonicalUrl, seoConfig } from "@/lib/seo";
import ContentPage, { H2, P, CTA } from "@/components/seo/ContentPage";
import JsonLd from "@/components/seo/JsonLd";

const title = "36 Innovation Domains & Hackathon Tracks";
const description =
  "Explore all 36 DEVTHON innovation domains — AI & Machine Learning, Generative AI, Cybersecurity, Blockchain, Cloud & DevOps, IoT, Robotics, HealthTech, FinTech, EdTech, AgriTech, ClimateTech, SpaceTech, AR/VR, Quantum Computing and more. Pick your hackathon track.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "hackathon domains",
    "hackathon tracks",
    "AI hackathon",
    "machine learning hackathon",
    "cybersecurity hackathon",
    "blockchain hackathon",
    "IoT hackathon",
    "robotics competition",
    "cloud computing competition",
    "web development competition",
    "fintech hackathon",
    "healthtech hackathon",
    "climatetech hackathon",
  ],
  alternates: { canonical: canonicalUrl("/domains") },
  openGraph: buildOgMetadata({ title, description, path: "/domains" }),
  twitter: buildTwitterMetadata({ title, description }),
};

const DOMAINS: { name: string; desc: string }[] = [
  { name: "Artificial Intelligence & Machine Learning", desc: "Build intelligent systems, predictive models, and ML-powered products." },
  { name: "Generative AI", desc: "LLMs, agents, RAG, image/video generation, and AI copilots." },
  { name: "Cybersecurity & Ethical Hacking", desc: "Threat detection, penetration testing, and secure-by-design systems." },
  { name: "Cloud Computing & DevOps", desc: "Scalable cloud-native architecture, CI/CD, and infrastructure automation." },
  { name: "Web Development", desc: "Full-stack web apps, modern frameworks, and performant experiences." },
  { name: "Mobile App Development", desc: "Native and cross-platform apps for Android and iOS." },
  { name: "Software Engineering", desc: "Robust, maintainable systems and developer tooling." },
  { name: "Data Science & Big Data Analytics", desc: "Turn data into insight with analytics, pipelines, and visualization." },
  { name: "Internet of Things (IoT)", desc: "Connected devices, sensors, and edge intelligence." },
  { name: "Robotics & Automation", desc: "Autonomous machines, control systems, and industrial automation." },
  { name: "Drone Technology", desc: "UAV navigation, aerial imaging, and drone-based solutions." },
  { name: "Blockchain & Web3", desc: "Decentralized apps, smart contracts, and tokenized systems." },
  { name: "HealthTech", desc: "Digital health, diagnostics, and patient-care innovation." },
  { name: "AgriTech", desc: "Technology for farming, crop science, and food supply chains." },
  { name: "FinTech", desc: "Payments, lending, insurance, and financial infrastructure." },
  { name: "EdTech", desc: "Learning platforms, assessment, and education access." },
  { name: "Smart Cities", desc: "Urban mobility, governance, and connected infrastructure." },
  { name: "Transportation & Mobility", desc: "Logistics, EVs, and next-generation mobility." },
  { name: "ClimateTech & Sustainability", desc: "Carbon, circular economy, and climate-resilient solutions." },
  { name: "Renewable Energy", desc: "Solar, storage, and clean-energy systems." },
  { name: "Industry 4.0 & Smart Manufacturing", desc: "Connected factories, digital twins, and predictive maintenance." },
  { name: "GovTech", desc: "Digital public services and citizen-facing platforms." },
  { name: "SpaceTech", desc: "Satellites, geospatial data, and space applications." },
  { name: "Defence Technology", desc: "Security, surveillance, and defence-grade systems." },
  { name: "AR/VR & Extended Reality", desc: "Immersive experiences for training, retail, and entertainment." },
  { name: "UI/UX & Product Design", desc: "Human-centered design, prototyping, and design systems." },
  { name: "Social Impact & Smart Communities", desc: "Technology for inclusion, accessibility, and community good." },
  { name: "Startup Innovation & Entrepreneurship", desc: "Zero-to-one product building and go-to-market." },
  { name: "Open Innovation", desc: "Bring your own bold idea across any emerging domain." },
  { name: "Quantum Computing", desc: "Quantum algorithms and next-generation computation." },
  { name: "BioTech & Life Sciences", desc: "Bioinformatics, genomics, and life-science tooling." },
  { name: "Supply Chain & Logistics", desc: "Visibility, optimization, and resilient supply networks." },
  { name: "E-Commerce & Retail Technology", desc: "Commerce platforms, personalization, and retail innovation." },
  { name: "Digital Media & Content Technology", desc: "Creator tools, streaming, and content intelligence." },
  { name: "LegalTech & Compliance", desc: "Contract automation, compliance, and access to justice." },
  { name: "Smart Infrastructure & Construction Technology", desc: "ConTech, BIM, and intelligent built environments." },
];

export default function DomainsPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "DEVTHON 2026 — 36 Innovation Domains",
    numberOfItems: DOMAINS.length,
    itemListElement: DOMAINS.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: d.name,
      description: d.desc,
    })),
  };

  return (
    <ContentPage
      kicker="TRACKS · 36 DOMAINS"
      title="36 Innovation Domains at DEVTHON 2026"
      intro="Whatever you're passionate about, there's a track for you. DEVTHON spans 36 innovation domains — from Artificial Intelligence and Cybersecurity to SpaceTech, ClimateTech, and Quantum Computing."
      breadcrumb={[{ name: "Domains", path: "/domains" }]}
    >
      <JsonLd data={itemList} />
      <P>
        Every domain below is open to students, developers, designers, and founders from across
        India. Pick the track that matches your skills and ambition, form a team of up to four, and
        build a solution that can become a real product — or even a funded startup through {seoConfig.siteName}.
      </P>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, margin: "28px 0" }}>
        {DOMAINS.map((d, i) => (
          <div key={d.name} style={{ border: "1px solid #262626", borderRadius: 12, padding: "16px 18px", background: "#0f0f0f" }}>
            <p style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, color: "#c8f135", marginBottom: 6 }}>
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6, lineHeight: 1.3 }}>
              {d.name}
            </h3>
            <p style={{ fontSize: 13, color: "#a1a1a1", lineHeight: 1.6 }}>{d.desc}</p>
          </div>
        ))}
      </div>

      <H2>Not sure which track to pick?</H2>
      <P>
        Choose Open Innovation and bring any idea you believe in — DEVTHON welcomes bold thinking
        across every emerging field. You can also register first and finalize your domain later.
      </P>

      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <CTA href="/hackathons" label="Register for DEVTHON 2026" />
        <CTA href="/faq" label="Read the FAQ" primary={false} />
      </div>
    </ContentPage>
  );
}
