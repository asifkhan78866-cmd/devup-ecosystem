import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const leads = await prisma.hackathonLead.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const seen = new Set<string>();
  const toDelete = [];

  for (const lead of leads) {
    const key = `${lead.hackathonId}-${lead.phone}`;
    if (seen.has(key)) {
      toDelete.push(lead.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    const res = await prisma.hackathonLead.deleteMany({
      where: { id: { in: toDelete } }
    });
    console.log(`Deleted ${res.count} duplicate leads.`);
  } else {
    console.log('No duplicate leads found.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
