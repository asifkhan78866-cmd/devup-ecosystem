import { PrismaClient, CofounderRole, CofounderStage, Availability } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const founders = await prisma.user.findMany({
    where: { role: 'FOUNDER' },
    include: { profile: true, cofounderProfile: true }
  });
  
  console.log(`Found ${founders.length} founders in the database.`);
  
  const missingProfiles = founders.filter(f => !f.cofounderProfile);
  console.log(`${missingProfiles.length} of them do not have a CofounderProfile. Creating them now...`);
  
  let createdCount = 0;
  for (const user of missingProfiles) {
    try {
      await prisma.cofounderProfile.create({
        data: {
          userId: user.id,
          role: CofounderRole.OTHER,
          stage: CofounderStage.IDEA,
          seeking: ['DEVELOPER', 'DESIGNER', 'MARKETER'], // default seeking
          availability: Availability.PART_TIME,
          idea: 'Currently exploring new ideas in the ecosystem.',
          isActive: true
        }
      });
      createdCount++;
      console.log(`Created profile for user ${user.id} (${user.profile?.name || user.email})`);
    } catch (err) {
      console.error(`Failed to create profile for user ${user.id}:`, err);
    }
  }
  
  console.log(`Successfully created ${createdCount} CofounderProfiles.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
