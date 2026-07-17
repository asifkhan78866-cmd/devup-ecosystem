import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const founders = await prisma.user.findMany({
    where: { role: 'FOUNDER' },
    include: { profile: true, cofounderProfile: true }
  });
  console.log(`Found ${founders.length} founders.`);
  const missingProfiles = founders.filter(f => !f.cofounderProfile);
  console.log(`${missingProfiles.length} of them do not have a CofounderProfile.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
