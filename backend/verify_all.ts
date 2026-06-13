import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.startup.updateMany({
    where: { isVerified: false },
    data: { isVerified: true },
  });
  console.log(`Verified ${result.count} startups!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
