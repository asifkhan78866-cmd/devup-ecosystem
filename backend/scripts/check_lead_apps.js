const { prisma } = require("../dist/lib/prisma");
(async () => {
  try {
    const count = await prisma.leadApplication.count();
    console.log("LEAD_APPLICATION_COUNT:", count);
    const apps = await prisma.leadApplication.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });
    console.log(
      "LATEST_APPS:",
      apps.map((a) => ({
        applicationNo: a.applicationNo,
        fullName: a.fullName,
        college: a.college,
        createdAt: a.createdAt,
      })),
    );
  } catch (e) {
    console.error("ERROR", e.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
