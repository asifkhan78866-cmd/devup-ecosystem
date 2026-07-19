const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.hackathon.update({
    where: { id: "9298523b-88d7-4512-81a3-9624faf8baa8" },
    data: { bannerUrl: "/devthon-poster-v2.jpeg" }
  });
  console.log("Updated bannerUrl to /devthon-poster-v2.jpeg");
}
main().catch(console.error).finally(() => prisma.$disconnect());
