/**
 * Seeds the three launch partners and their offers, from the artwork already
 * in circulation. Idempotent — safe to re-run.
 *
 *   node prisma/seed-partners.js
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ log: [] });

const PARTNERS = [
  {
    code: "D2PR",
    name: "D2PR Spaces",
    slug: "d2pr-spaces",
    category: "WORKSPACE",
    brandColor: "#1F7A4D",
    contactPhone: "+91 93917 37673",
    addressLine1: "3rd Floor, Block-C, Vaishnavi Cymbol",
    addressLine2: "Hyderabad Financial District",
    city: "Hyderabad",
    state: "Telangana",
    perks: [
      {
        title: "50% off a monthly workspace pass",
        subtitle: "A professional desk at D2PR Spaces, half price for DevUp members.",
        type: "PERCENT_OFF",
        percentOff: 50,
        originalPrice: 13000,
        finalPrice: 6500,
        priceUnit: "every month",
        awardValidityDays: 60,
        perPersonCap: 1,
        highlights: [
          "High-Speed Wi-Fi",
          "Unlimited Coffee & Tea",
          "Printer & Scanner",
          "Car Parking",
          "Secure Workspace",
          "Night Shift Access",
          "Cafeteria",
          "Fully Furnished",
          "Plug & Play Setup",
        ],
        terms: [
          "Valid for the named holder only and cannot be transferred.",
          "Subject to desk availability at the time of booking.",
        ],
      },
    ],
  },
  {
    code: "STA",
    name: "StartupsIndia",
    slug: "startupsindia-perks",
    category: "PROGRAM",
    brandColor: "#D92B2B",
    website: "https://www.startupsindia.in",
    city: "Hyderabad",
    state: "Telangana",
    perks: [
      {
        title: "25% off startup ecosystem programs",
        subtitle: "From idea to impact — masterclasses, pre-incubation and accelerator programmes.",
        type: "PERCENT_OFF",
        percentOff: 25,
        awardValidityDays: 90,
        perPersonCap: 1,
        highlights: [
          "Idea Validation",
          "Masterclasses",
          "Pre-Incubation",
          "Accelerator Programs",
          "Business Networking",
          "Demo Day",
          "Funding Opportunities",
          "Government Grants Support",
        ],
        terms: [
          "Applies to eligible programmes only.",
          "Funding, grants and investment opportunities remain subject to evaluation.",
        ],
      },
    ],
  },
  {
    code: "IEC",
    name: "Innovation & Entrepreneurship Council",
    slug: "innovation-entrepreneurship-council",
    category: "COUNCIL",
    brandColor: "#C8912B",
    contactPhone: "+91 91007 70398",
    perks: [
      {
        title: "Referral to the startup ecosystem",
        subtitle: "Meet founders, mentors and ecosystem professionals offline.",
        type: "REFERRAL",
        awardValidityDays: 90,
        perPersonCap: 1,
        highlights: [
          "Incubation Support",
          "Funding Opportunity Support",
          "Government Grants Support",
          "Startup Ecosystem Exposure",
          "Founder Networking",
        ],
        terms: ["Introductions are subject to availability and fit."],
      },
    ],
  },
];

(async () => {
  const admin = await prisma.user.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    select: { id: true },
  });
  if (!admin) throw new Error("No admin user to attribute the seed to");

  for (const spec of PARTNERS) {
    const { perks, ...fields } = spec;

    // Reuse the ecosystem startup record when one exists — StartupsIndia is
    // both a partner and a startup, and should not become two organisations.
    const startup = await prisma.startup.findFirst({
      where: { code: spec.code },
      select: { id: true, logoUrl: true },
    });

    const partner = await prisma.partner.upsert({
      where: { code: spec.code },
      create: { ...fields, logoUrl: startup?.logoUrl ?? null, startupId: startup?.id ?? null },
      update: { ...fields, ...(startup ? { logoUrl: startup.logoUrl, startupId: startup.id } : {}) },
    });

    for (const perkSpec of perks) {
      const existing = await prisma.perk.findFirst({
        where: { partnerId: partner.id, title: perkSpec.title },
      });

      if (existing) {
        await prisma.perk.update({ where: { id: existing.id }, data: perkSpec });
        console.log(`~ ${partner.code}  ${perkSpec.title} (updated, ${existing.status})`);
      } else {
        // Seeded perks arrive LIVE: these three deals are already agreed and
        // already in print.
        const created = await prisma.perk.create({
          data: {
            ...perkSpec,
            partnerId: partner.id,
            status: "LIVE",
            approvedBy: admin.id,
            approvedAt: new Date(),
          },
        });
        console.log(`+ ${partner.code}  ${created.title} (LIVE)`);
      }
    }
  }

  console.log(
    `\ndone — ${await prisma.partner.count()} partners, ${await prisma.perk.count()} perks`
  );
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("ERROR", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
