import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@devup-test.com'
      }
    }
  });

  console.log(`Found ${users.length} test users to delete.`);
  
  for (const user of users) {
    console.log(`Deleting user: ${user.email}`);
    await prisma.user.delete({ where: { id: user.id } });
  }

  console.log('Finished deleting test users.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
