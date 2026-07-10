const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({
      where: { id: '9da83026-bcbd-4e64-ba89-108e22f50910' },
      include: {
        profile: true,
        startupMemberships: {
          where: { status: "ACTIVE" },
          include: { startup: { select: { id: true, slug: true, name: true } } },
        },
      },
    });
  console.log(JSON.stringify(user, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
