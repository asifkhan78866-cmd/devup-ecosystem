import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // The schema has no fields for: subtitle/tagline, durationHours, venue, eligibility,
  // perks, or status. These are folded into the description field.
  // "venue" → stored in "location" (schema field).
  // "domains" → stored in "domain" (schema String[] field).
  // "registrationUrl" → stored in "registrationLink" (schema field).
  // "mode: Offline" → stored as enum "OFFLINE".
  // Image → copied to frontend/public/images/ as a static asset; stored in bannerUrl.

  const hackathon = await prisma.hackathon.create({
    data: {
      title: "Vynedam Talent Hunt 2K26",
      description: [
        "36-Hour Non-Stop Offline National Innovation Challenge",
        "",
        "VYNEDAM Talent Hunt 2K26 is a 36-hour non-stop offline innovation challenge bringing together students, developers, and aspiring entrepreneurs to solve high-impact, real-world problems curated by industry veterans. Domains span AI/ML (Generative AI, Predictive Analytics), Cybersecurity & Blockchain, Web & Mobile Development, Cloud & IoT, and Social Impact.",
        "",
        "Duration: 36 hours",
        "Eligibility: Students & Recent Graduates",
        "",
        "Perks:",
        "• ₹1,00,000+ Prize Pool & Trophies for top teams",
        "• Guaranteed internships for all participants (Paid for top performers)",
        "• Official merit & participation certificates",
        "• Industry expert networking & real-world AI/DSA problem-solving",
      ].join("\n"),
      organizer: "Vynedam & Malla Reddy University",
      prizePool: "₹1,00,000+",
      mode: "OFFLINE",
      location: "Malla Reddy University (MRDU), Hyderabad",
      domain: [
        "AI & Machine Learning",
        "Cybersecurity & Blockchain",
        "Web & Mobile Development",
        "Cloud & IoT",
        "Social Impact",
      ],
      startDate: new Date("2026-07-04T00:00:00.000Z"),
      endDate: new Date("2026-07-05T12:00:00.000Z"),
      registrationDeadline: new Date("2026-07-02T23:59:59.000Z"),
      registrationLink: "https://forms.gle/PaPXVriQAm5wX86k9",
      bannerUrl: "/images/vynedam-talent-hunt-2k26.jpeg",
      isActive: true,
      isFeatured: true,
      isEcosystemHosted: false,
    },
  });

  console.log("✅ Hackathon created successfully!");
  console.log(JSON.stringify(hackathon, null, 2));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
