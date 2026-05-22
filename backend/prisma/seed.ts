import { PrismaClient, Domain, Stage, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create a dummy admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@devup.in" },
    update: {},
    create: {
      email: "admin@devup.in",
      role: Role.ADMIN,
      isVerified: true,
      profile: {
        create: {
          name: "System Admin",
          city: "Bengaluru",
          skills: ["System Architecture"],
        }
      }
    }
  });

  // 2. Create founders and startups
  const startups = [
    {
      name: "NexusAI",
      slug: "nexus-ai",
      tagline: "Next-gen LLM orchestration for enterprise.",
      description: "Building the next generation of autonomous AI agents for enterprise workflow optimization.",
      logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=NexusAI&backgroundColor=0a0a0a",
      bannerUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop",
      domain: Domain.AI_ML,
      stage: Stage.SEED,
      foundedYear: 2024,
      headcount: "10-50",
      location: "San Francisco, CA",
      founderName: "Sarah Chen",
      founderEmail: "sarah@nexus.ai",
      isFeatured: true,
      isVerified: true,
    },
    {
      name: "Orbit Pay",
      slug: "orbit-pay",
      tagline: "Borderless crypto payroll solutions.",
      description: "Borderless crypto payroll solutions for global remote teams.",
      logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=OrbitPay&backgroundColor=0a0a0a",
      bannerUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
      domain: Domain.FINTECH,
      stage: Stage.SERIES_A,
      foundedYear: 2023,
      headcount: "50-200",
      location: "New York, NY",
      founderName: "Michael Ross",
      founderEmail: "michael@orbit.pay",
      isFeatured: true,
      isVerified: true,
    },
    {
      name: "Lumina Health",
      slug: "lumina-health",
      tagline: "Predictive diagnostics using wearable data.",
      description: "Predictive diagnostics using wearable biometric data.",
      logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Lumina&backgroundColor=0a0a0a",
      bannerUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1200&auto=format&fit=crop",
      domain: Domain.HEALTHTECH,
      stage: Stage.PRE_SEED,
      foundedYear: 2023,
      headcount: "1-10",
      location: "Boston, MA",
      founderName: "Dr. Emily Taylor",
      founderEmail: "emily@lumina.health",
      isFeatured: true,
      isVerified: true,
    },
    {
      name: "CloudForge",
      slug: "cloud-forge",
      tagline: "Zero-config cloud deployment.",
      description: "Zero-configuration cloud deployment infrastructure for indie developers.",
      logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=CloudForge&backgroundColor=0a0a0a",
      bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
      domain: Domain.DEVTOOLS,
      stage: Stage.SEED,
      foundedYear: 2024,
      headcount: "10-50",
      location: "Remote",
      founderName: "David Kim",
      founderEmail: "david@cloudforge.dev",
      isFeatured: true,
      isVerified: true,
    }
  ];

  for (const s of startups) {
    const founder = await prisma.user.upsert({
      where: { email: s.founderEmail },
      update: {},
      create: {
        email: s.founderEmail,
        role: Role.FOUNDER,
        isVerified: true,
        profile: {
          create: {
            name: s.founderName,
            city: s.location,
            skills: ["Leadership", "Product"],
          }
        }
      }
    });

    await prisma.startup.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        name: s.name,
        slug: s.slug,
        tagline: s.tagline,
        description: s.description,
        logoUrl: s.logoUrl,
        bannerUrl: s.bannerUrl,
        domain: s.domain,
        stage: s.stage,
        foundedYear: s.foundedYear,
        headcount: s.headcount,
        location: s.location,
        isFeatured: s.isFeatured,
        isVerified: s.isVerified,
        founderId: founder.id,
        founders: {
          connect: [{ id: founder.id }]
        }
      }
    });
  }

  // 3. Create Testimonials
  const testimonials = [
    {
      quote: "DevUp Ecosystem was the catalyst we needed. The network, the resources, and the community accelerated our growth by at least two years.",
      authorName: "Sarah Chen",
      role: "CEO",
      company: "NexusAI",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      order: 1
    },
    {
      quote: "Finding our co-founder and lead engineer through the DevUp platform was seamless. It's the ultimate hub for serious builders.",
      authorName: "David Kim",
      role: "Founder",
      company: "CloudForge",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      order: 2
    },
    {
      quote: "The application process was rigorous but incredibly rewarding. Being part of this ecosystem opens doors you didn't even know existed.",
      authorName: "Michael Ross",
      role: "CEO",
      company: "Orbit Pay",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      order: 3
    }
  ];

  for (const t of testimonials) {
    await prisma.testimonial.create({
      data: t
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
