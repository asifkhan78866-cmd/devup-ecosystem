/**
 * One-shot backfill for people onboarded before they had an account.
 *
 * Direct hire writes Employee/Intern/StartupMember rows keyed on email with
 * `userId: null`. Until the claim-on-signup fix, anyone who signed up afterwards
 * was never linked, so their dashboard showed no workspace, no onboarding
 * checklist and no attendance despite being on the team.
 *
 * Run: node prisma/backfill-claims.js [--apply]
 * Without --apply it only reports.
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ log: [] });

const APPLY = process.argv.includes("--apply");

(async () => {
  const [interns, employees, members] = await Promise.all([
    prisma.intern.findMany({ where: { userId: null }, select: { id: true, email: true, internCode: true, fullName: true } }),
    prisma.employee.findMany({ where: { userId: null }, select: { id: true, email: true, employeeCode: true, fullName: true } }),
    prisma.startupMember.findMany({ where: { userId: null }, select: { id: true, email: true, role: true, status: true } }),
  ]);

  const emails = [...new Set([...interns, ...employees, ...members].map((r) => r.email?.toLowerCase()).filter(Boolean))];
  const users = await prisma.user.findMany({
    where: { email: { in: emails, mode: "insensitive" } },
    select: { id: true, email: true },
  });
  const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u.id]));

  let linked = 0, activated = 0, waiting = 0;

  for (const email of emails) {
    const userId = byEmail.get(email);
    const mine = {
      interns: interns.filter((r) => r.email?.toLowerCase() === email),
      employees: employees.filter((r) => r.email?.toLowerCase() === email),
      members: members.filter((r) => r.email?.toLowerCase() === email),
    };
    const count = mine.interns.length + mine.employees.length + mine.members.length;

    if (!userId) {
      waiting++;
      console.log(`WAITING  ${email} — ${count} record(s), no account yet (will link on signup)`);
      continue;
    }

    console.log(`LINK     ${email} -> ${userId} (${mine.interns.length} intern, ${mine.employees.length} employee, ${mine.members.length} membership)`);
    linked += count;

    if (!APPLY) continue;

    await prisma.intern.updateMany({ where: { id: { in: mine.interns.map((r) => r.id) } }, data: { userId } });
    await prisma.employee.updateMany({ where: { id: { in: mine.employees.map((r) => r.id) } }, data: { userId } });
    await prisma.startupMember.updateMany({ where: { id: { in: mine.members.map((r) => r.id) } }, data: { userId } });

    // Activate only memberships backed by a real HR record — a genuine pending
    // invitation still has to be accepted by the person.
    if (mine.interns.length || mine.employees.length) {
      const startupIds = [
        ...new Set(
          [
            ...(await prisma.intern.findMany({ where: { userId }, select: { startupId: true } })),
            ...(await prisma.employee.findMany({ where: { userId }, select: { startupId: true } })),
          ].map((r) => r.startupId)
        ),
      ];
      const res = await prisma.startupMember.updateMany({
        where: { userId, startupId: { in: startupIds }, status: "INVITED" },
        data: { status: "ACTIVE", joinedAt: new Date() },
      });
      activated += res.count;
    }
  }

  console.log(
    `\n${APPLY ? "APPLIED" : "DRY RUN"} — ${linked} record(s) linked, ${activated} membership(s) activated, ` +
      `${waiting} email(s) still waiting for signup`
  );
  if (!APPLY && linked > 0) console.log("Re-run with --apply to write the changes.");

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("ERROR", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
