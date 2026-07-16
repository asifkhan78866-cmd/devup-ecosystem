export const PREDEFINED_DOMAINS = [
  "Artificial Intelligence & Machine Learning",
  "Generative AI",
  "Cybersecurity & Ethical Hacking",
  "Cloud Computing & DevOps",
  "Web Development",
  "Mobile App Development",
  "Software Engineering",
  "Data Science & Big Data Analytics",
  "Internet of Things (IoT)",
  "Robotics & Automation",
  "Drone Technology",
  "Blockchain & Web3",
  "HealthTech",
  "AgriTech",
  "FinTech",
  "EdTech",
  "Smart Cities",
  "Transportation & Mobility",
  "ClimateTech & Sustainability",
  "Renewable Energy",
  "Industry 4.0 & Smart Manufacturing",
  "GovTech",
  "SpaceTech",
  "Defence Technology",
  "AR/VR & Extended Reality",
  "UI/UX & Product Design",
  "Social Impact & Smart Communities",
  "Startup Innovation & Entrepreneurship",
  "Open Innovation",
  "Quantum Computing",
  "BioTech & Life Sciences",
  "Supply Chain & Logistics",
  "E-Commerce & Retail Technology",
  "Digital Media & Content Technology",
  "LegalTech & Compliance",
  "Smart Infrastructure & Construction Technology"
];

const DOMAIN_COLORS = ["#c8f135", "#a78bfa", "#38bdf8", "#fb923c", "#f472b6"];

export const ALL_DOMAINS = PREDEFINED_DOMAINS.map((domain, i) => ({
  label: domain,
  sub: "",
  color: DOMAIN_COLORS[i % DOMAIN_COLORS.length]
}));
