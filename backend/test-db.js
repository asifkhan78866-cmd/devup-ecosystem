const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const h = await prisma.hackathon.findUnique({ where: { id: "9298523b-88d7-4512-81a3-9624faf8baa8" }});
  console.log(h.bannerUrl);
}
main().catch(console.error).finally(() => prisma.$disconnect());
