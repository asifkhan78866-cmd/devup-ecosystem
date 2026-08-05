/**
 * One-shot backfill for the hiring module rollout.
 *  1. Assigns each existing startup an immutable tenant code.
 *  2. Denormalises startupId onto existing JobApplication rows.
 *  3. Allocates application numbers for applications that predate numbering.
 *  4. Seeds an APPLIED stage event for applications with no history.
 *  5. Migrates legacy StartupMember roles (OWNER -> FOUNDER, MEMBER -> EMPLOYEE).
 *
 * Safe to re-run: every step skips rows that already have values.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const EXPLICIT_CODES = {
  zappyone: "ZAP",
  "devup-society": "DIA",
  elunora: "ELN",
  yarniakroshay: "YRN",
};

function deriveCode(startup, taken) {
  const explicit = EXPLICIT_CODES[startup.slug] || EXPLICIT_CODES[startup.name.toLowerCase()];
  if (explicit && !taken.has(explicit)) return explicit;

  const letters = startup.name.toUpperCase().replace(/[^A-Z]/g, "");
  for (let len = 3; len <= 5; len++) {
    const candidate = letters.slice(0, len).padEnd(3, "X");
    if (candidate.length >= 2 && !taken.has(candidate)) return candidate;
  }
  let i = 1;
  while (taken.has(`${letters.slice(0, 2)}${i}`)) i++;
  return `${letters.slice(0, 2)}${i}`;
}

(async () => {
  const startups = await prisma.startup.findMany({ orderBy: { createdAt: "asc" } });
  const taken = new Set(startups.map((s) => s.code).filter(Boolean));

  for (const s of startups) {
    if (s.code) continue;
    const code = deriveCode(s, taken);
    taken.add(code);
    await prisma.startup.update({ where: { id: s.id }, data: { code } });
    console.log(`code  ${s.name} -> ${code}`);
  }

  // Denormalise startupId onto applications so tenant scoping can filter directly.
  const apps = await prisma.jobApplication.findMany({
    where: { startupId: null },
    include: { job: { select: { startupId: true } } },
  });
  for (const a of apps) {
    await prisma.jobApplication.update({
      where: { id: a.id },
      data: { startupId: a.job.startupId },
    });
  }
  if (apps.length) console.log(`startupId backfilled on ${apps.length} applications`);

  // Allocate application numbers for pre-existing applications.
  const unnumbered = await prisma.jobApplication.findMany({
    where: { applicationNo: null },
    orderBy: { appliedAt: "asc" },
    include: { job: { select: { startupId: true } } },
  });
  for (const a of unnumbered) {
    const startupId = a.startupId || a.job.startupId;
    const startup = await prisma.startup.findUnique({ where: { id: startupId } });
    const seq = await prisma.numberSequence.upsert({
      where: { startupId_kind_period: { startupId, kind: "APPLICATION", period: "*" } },
      create: { startupId, kind: "APPLICATION", period: "*", current: 1 },
      update: { current: { increment: 1 } },
      select: { current: true },
    });
    await prisma.jobApplication.update({
      where: { id: a.id },
      data: { applicationNo: `APP-${startup.code}-${String(seq.current).padStart(6, "0")}` },
    });
  }
  if (unnumbered.length) console.log(`numbered ${unnumbered.length} applications`);

  // Seed history for applications that have none, so the event log is complete.
  const noHistory = await prisma.jobApplication.findMany({
    where: { events: { none: {} } },
    include: { job: { select: { startupId: true } } },
  });
  for (const a of noHistory) {
    await prisma.applicationStageEvent.create({
      data: {
        startupId: a.startupId || a.job.startupId,
        applicationId: a.id,
        fromStage: null,
        toStage: "APPLIED",
        note: "Backfilled from pre-pipeline record",
        createdAt: a.appliedAt,
      },
    });
  }
  if (noHistory.length) console.log(`seeded history for ${noHistory.length} applications`);

  const owners = await prisma.startupMember.updateMany({
    where: { role: "OWNER" },
    data: { role: "FOUNDER" },
  });
  const members = await prisma.startupMember.updateMany({
    where: { role: "MEMBER" },
    data: { role: "EMPLOYEE" },
  });
  console.log(`roles migrated: ${owners.count} OWNER->FOUNDER, ${members.count} MEMBER->EMPLOYEE`);

  console.table(
    (await prisma.startup.findMany({ select: { name: true, code: true } })).map((s) => s)
  );
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
