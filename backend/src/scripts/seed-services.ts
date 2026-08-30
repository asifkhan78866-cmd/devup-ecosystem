import { prisma } from "../lib/prisma";

/**
 * Moves the service catalogue out of the frontend and into the database.
 *
 * Idempotent on slug, so it can be run again after the source file changes
 * without duplicating anything or overwriting an edit made in the admin — a
 * service already in the database is left alone, because the admin is now the
 * source of truth and this script is only the way the first thirty got there.
 *
 * Run with: npx ts-node src/scripts/seed-services.ts
 */

interface SourceService {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  icon?: string;
  short: string;
  tagline?: string;
  size?: string;
  whyDevUp?: unknown;
  whatsIncluded?: string[];
  howItWorks?: unknown;
  engagementType?: string;
}

async function main() {
  // Loaded at runtime so the backend build does not depend on the frontend.
  const path = require("path").resolve(process.cwd(), "../frontend/data/services.ts");
  const source: string = require("fs").readFileSync(path, "utf-8");

  // The file is TypeScript, so it is transpiled in memory rather than parsed.
  const ts = require("typescript");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;

  const module_ = { exports: {} as Record<string, unknown> };
  new Function("module", "exports", "require", js)(module_, module_.exports, require);

  const list = (module_.exports.services ?? module_.exports.default) as SourceService[] | undefined;
  if (!Array.isArray(list)) {
    throw new Error("Could not find an exported services array in frontend/data/services.ts");
  }

  let created = 0;
  let skipped = 0;

  for (const [i, s] of list.entries()) {
    const slug = s.id;
    const existing = await prisma.service.findUnique({ where: { slug } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.service.create({
      data: {
        slug,
        name: s.name,
        category: s.category,
        categoryLabel: s.categoryLabel,
        icon: s.icon ?? null,
        short: s.short,
        tagline: s.tagline ?? null,
        size: s.size ?? "small",
        whyDevUp: (s.whyDevUp ?? null) as never,
        whatsIncluded: s.whatsIncluded ?? [],
        howItWorks: (s.howItWorks ?? null) as never,
        engagementType: s.engagementType ?? null,
        sortOrder: i,
      },
    });
    created++;
  }

  const total = await prisma.service.count();
  console.log(`seeded ${created}, left alone ${skipped}, catalogue now holds ${total}`);
}

main()
  .catch((e) => {
    console.error("seed failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
