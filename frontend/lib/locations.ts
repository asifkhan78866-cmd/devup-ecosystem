/**
 * Location data for programmatic local-SEO landing pages.
 *
 * Each entry powers a page at /hackathons-in/<slug> that targets queries like
 * "hackathon in <city>", "<city> hackathon 2026", "college hackathon <city>".
 *
 * DEVTHON's physical event is in Hyderabad; other cities are targeted because
 * DEVTHON is a NATIONAL hackathon that draws participants (and offers online
 * participation) from every major Indian tech hub. Copy is written honestly
 * around that framing — we never claim a physical venue we don't have.
 */

export type LocationTier = "primary" | "secondary";

export interface LocationData {
  /** URL slug, e.g. "hyderabad" -> /hackathons-in/hyderabad */
  slug: string;
  /** Display name, e.g. "Hyderabad" */
  city: string;
  /** State / region the city belongs to */
  region: string;
  /** True for the state-level or country-level pages */
  isRegionPage?: boolean;
  tier: LocationTier;
  /** Latitude / longitude for geo meta + LocalBusiness/Place schema */
  geo: { lat: string; lng: string };
  /** ISO 3166-2 region code, e.g. "IN-TG" for geo.region meta */
  regionCode: string;
  /** Notable engineering colleges / universities in the area (entity SEO) */
  colleges: string[];
  /** Short, human blurb used in intros and meta descriptions */
  blurb: string;
}

/**
 * The complete target-location set from the SEO brief.
 * Primary = Hyderabad + Telangana + India (deep pages).
 * Secondary = the 20 metro tech hubs.
 */
export const LOCATIONS: LocationData[] = [
  // ─── PRIMARY ───────────────────────────────────────────────
  {
    slug: "hyderabad",
    city: "Hyderabad",
    region: "Telangana",
    tier: "primary",
    geo: { lat: "17.3850", lng: "78.4867" },
    regionCode: "IN-TG",
    colleges: [
      "Vidya Jyothi Institute of Technology (VJIT)",
      "IIT Hyderabad",
      "IIIT Hyderabad",
      "Osmania University",
      "JNTU Hyderabad",
      "CBIT",
      "VNR VJIET",
      "CVR College of Engineering",
      "Vasavi College of Engineering",
      "BITS Pilani Hyderabad",
    ],
    blurb:
      "Hyderabad — India's fastest-growing deep-tech and startup capital, home to HITEC City, T-Hub, and hundreds of engineering colleges.",
  },
  {
    slug: "telangana",
    city: "Telangana",
    region: "Telangana",
    isRegionPage: true,
    tier: "primary",
    geo: { lat: "17.3850", lng: "78.4867" },
    regionCode: "IN-TG",
    colleges: [
      "Vidya Jyothi Institute of Technology (VJIT)",
      "IIT Hyderabad",
      "IIIT Hyderabad",
      "NIT Warangal",
      "Kakatiya University",
      "JNTU Hyderabad",
      "Osmania University",
    ],
    blurb:
      "Telangana — a national leader in IT exports and innovation policy, powered by Hyderabad, Warangal, and a thriving college ecosystem.",
  },
  {
    slug: "india",
    city: "India",
    region: "India",
    isRegionPage: true,
    tier: "primary",
    geo: { lat: "20.5937", lng: "78.9629" },
    regionCode: "IN",
    colleges: [
      "IITs",
      "NITs",
      "IIITs",
      "BITS Pilani",
      "VIT",
      "State engineering universities across all 28 states",
    ],
    blurb:
      "India — the world's largest pool of student developers and engineers, and one of the most vibrant startup ecosystems on the planet.",
  },

  // ─── SECONDARY (metro tech hubs) ───────────────────────────
  { slug: "bengaluru", city: "Bengaluru", region: "Karnataka", tier: "secondary", geo: { lat: "12.9716", lng: "77.5946" }, regionCode: "IN-KA", colleges: ["IISc Bangalore", "RV College of Engineering", "PES University", "BMS College of Engineering", "MS Ramaiah Institute of Technology"], blurb: "Bengaluru — India's Silicon Valley and the country's densest concentration of tech talent and startups." },
  { slug: "chennai", city: "Chennai", region: "Tamil Nadu", tier: "secondary", geo: { lat: "13.0827", lng: "80.2707" }, regionCode: "IN-TN", colleges: ["IIT Madras", "Anna University", "SSN College of Engineering", "VIT Chennai", "SRM Institute of Science and Technology"], blurb: "Chennai — a powerhouse of engineering education, SaaS, and deep-tech manufacturing." },
  { slug: "mumbai", city: "Mumbai", region: "Maharashtra", tier: "secondary", geo: { lat: "19.0760", lng: "72.8777" }, regionCode: "IN-MH", colleges: ["IIT Bombay", "VJTI", "Sardar Patel Institute of Technology", "K. J. Somaiya College of Engineering", "University of Mumbai"], blurb: "Mumbai — India's financial capital and a fast-rising fintech and startup hub." },
  { slug: "delhi", city: "Delhi", region: "Delhi NCR", tier: "secondary", geo: { lat: "28.6139", lng: "77.2090" }, regionCode: "IN-DL", colleges: ["IIT Delhi", "Delhi Technological University (DTU)", "NSUT", "IIIT Delhi", "Jamia Millia Islamia"], blurb: "Delhi NCR — home to India's top engineering institutes and a booming startup corridor across Gurugram and Noida." },
  { slug: "pune", city: "Pune", region: "Maharashtra", tier: "secondary", geo: { lat: "18.5204", lng: "73.8567" }, regionCode: "IN-MH", colleges: ["COEP Technological University", "VIT Pune", "MIT-WPU", "PICT", "Symbiosis Institute of Technology"], blurb: "Pune — the Oxford of the East, with one of India's largest student and IT populations." },
  { slug: "kolkata", city: "Kolkata", region: "West Bengal", tier: "secondary", geo: { lat: "22.5726", lng: "88.3639" }, regionCode: "IN-WB", colleges: ["IIT Kharagpur", "Jadavpur University", "IIEST Shibpur", "Heritage Institute of Technology"], blurb: "Kolkata — eastern India's academic and cultural capital with a rich engineering heritage." },
  { slug: "ahmedabad", city: "Ahmedabad", region: "Gujarat", tier: "secondary", geo: { lat: "23.0225", lng: "72.5714" }, regionCode: "IN-GJ", colleges: ["IIT Gandhinagar", "Nirma University", "DAIICT", "L.D. College of Engineering"], blurb: "Ahmedabad — Gujarat's entrepreneurial engine and a growing deep-tech and design hub." },
  { slug: "jaipur", city: "Jaipur", region: "Rajasthan", tier: "secondary", geo: { lat: "26.9124", lng: "75.7873" }, regionCode: "IN-RJ", colleges: ["MNIT Jaipur", "LNMIIT", "Poornima College of Engineering", "JECRC"], blurb: "Jaipur — Rajasthan's fastest-growing tech and startup destination." },
  { slug: "lucknow", city: "Lucknow", region: "Uttar Pradesh", tier: "secondary", geo: { lat: "26.8467", lng: "80.9462" }, regionCode: "IN-UP", colleges: ["IIT Kanpur (nearby)", "AKTU", "IIIT Lucknow", "BBD University"], blurb: "Lucknow — the rising IT and innovation center of Uttar Pradesh." },
  { slug: "bhopal", city: "Bhopal", region: "Madhya Pradesh", tier: "secondary", geo: { lat: "23.2599", lng: "77.4126" }, regionCode: "IN-MP", colleges: ["IIT Indore (nearby)", "MANIT Bhopal", "IIIT Bhopal", "LNCT"], blurb: "Bhopal — a fast-emerging engineering education hub in central India." },
  { slug: "bhubaneswar", city: "Bhubaneswar", region: "Odisha", tier: "secondary", geo: { lat: "20.2961", lng: "85.8245" }, regionCode: "IN-OR", colleges: ["IIT Bhubaneswar", "NIT Rourkela (nearby)", "KIIT University", "IIIT Bhubaneswar"], blurb: "Bhubaneswar — eastern India's smart-city and IT growth story." },
  { slug: "visakhapatnam", city: "Visakhapatnam", region: "Andhra Pradesh", tier: "secondary", geo: { lat: "17.6868", lng: "83.2185" }, regionCode: "IN-AP", colleges: ["Andhra University", "GITAM University", "IIM Visakhapatnam", "GVP College of Engineering"], blurb: "Visakhapatnam (Vizag) — Andhra Pradesh's coastal IT and fintech hub." },
  { slug: "warangal", city: "Warangal", region: "Telangana", tier: "secondary", geo: { lat: "17.9689", lng: "79.5941" }, regionCode: "IN-TG", colleges: ["NIT Warangal", "Kakatiya University", "SR University", "Vaagdevi College of Engineering"], blurb: "Warangal — Telangana's second-largest city and home to NIT Warangal." },
  { slug: "coimbatore", city: "Coimbatore", region: "Tamil Nadu", tier: "secondary", geo: { lat: "11.0168", lng: "76.9558" }, regionCode: "IN-TN", colleges: ["PSG College of Technology", "Amrita Vishwa Vidyapeetham", "Coimbatore Institute of Technology", "Kumaraguru College of Technology"], blurb: "Coimbatore — Tamil Nadu's manufacturing and engineering education powerhouse." },
  { slug: "kochi", city: "Kochi", region: "Kerala", tier: "secondary", geo: { lat: "9.9312", lng: "76.2673" }, regionCode: "IN-KL", colleges: ["CUSAT", "Rajagiri School of Engineering", "Model Engineering College", "FISAT"], blurb: "Kochi — Kerala's startup capital, anchored by one of India's largest tech parks." },
  { slug: "indore", city: "Indore", region: "Madhya Pradesh", tier: "secondary", geo: { lat: "22.7196", lng: "75.8577" }, regionCode: "IN-MP", colleges: ["IIT Indore", "IIM Indore", "SGSITS", "Acropolis Institute of Technology"], blurb: "Indore — central India's cleanest city and a booming IT and edtech hub." },
  { slug: "nagpur", city: "Nagpur", region: "Maharashtra", tier: "secondary", geo: { lat: "21.1458", lng: "79.0882" }, regionCode: "IN-MH", colleges: ["VNIT Nagpur", "IIM Nagpur", "IIIT Nagpur", "GHRCE"], blurb: "Nagpur — the geographic heart of India and a growing IT and logistics hub." },
  { slug: "surat", city: "Surat", region: "Gujarat", tier: "secondary", geo: { lat: "21.1702", lng: "72.8311" }, regionCode: "IN-GJ", colleges: ["SVNIT Surat", "SCET", "Auro University"], blurb: "Surat — one of India's fastest-growing cities and a rising tech-adoption leader." },
  { slug: "patna", city: "Patna", region: "Bihar", tier: "secondary", geo: { lat: "25.5941", lng: "85.1376" }, regionCode: "IN-BR", colleges: ["IIT Patna", "NIT Patna", "Chandragupt Institute of Management"], blurb: "Patna — Bihar's education capital with a rapidly growing developer community." },
  { slug: "vijayawada", city: "Vijayawada", region: "Andhra Pradesh", tier: "secondary", geo: { lat: "16.5062", lng: "80.6480" }, regionCode: "IN-AP", colleges: ["VIT-AP University", "SRM University AP", "VR Siddhartha Engineering College", "IIIT (nearby)"], blurb: "Vijayawada — a central Andhra Pradesh hub for engineering education and startups." },
];

export function getLocation(slug: string): LocationData | undefined {
  return LOCATIONS.find((l) => l.slug === slug);
}

export function allLocationSlugs(): string[] {
  return LOCATIONS.map((l) => l.slug);
}
