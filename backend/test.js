const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const m = await prisma.startupMember.findMany({ where: { email: 'asifsyed2505@gmail.com' } });
  console.log(m);
  const u = await prisma.user.findUnique({ where: { email: 'asifsyed2505@gmail.com' }, include: { startupMemberships: true } });
  console.log(u);
}
main().catch(console.error).finally(() => prisma.$disconnect());
