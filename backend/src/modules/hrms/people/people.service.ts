import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { audit } from "../../shared/audit.service";
import { getChecklist } from "../onboarding/onboarding.service";

/**
 * Everything about one person in a startup: their record, their onboarding
 * documents, and the documents the company has issued them.
 */

async function resolve(startupId: string, personId: string) {
  const employee = await prisma.employee.findFirst({
    where: { id: personId, startupId },
    include: {
      documents: { orderBy: { issuedAt: "desc" } },
      application: {
        select: {
          id: true, applicationNo: true, appliedAt: true,
          job: { select: { title: true } },
        },
      },
      user: { select: { id: true, email: true, avatarUrl: true } },
    },
  });
  if (employee) return { kind: "EMPLOYEE" as const, employee, intern: null };

  const intern = await prisma.intern.findFirst({
    where: { id: personId, startupId },
    include: {
      documents: { orderBy: { issuedAt: "desc" } },
      application: {
        select: {
          id: true, applicationNo: true, appliedAt: true,
          job: { select: { title: true } },
        },
      },
      user: { select: { id: true, email: true, avatarUrl: true } },
    },
  });
  if (intern) return { kind: "INTERN" as const, employee: null, intern };

  throw new AppError(404, "Person not found in this startup", "NOT_FOUND");
}

export async function getPerson(startupId: string, personId: string) {
  const { kind, employee, intern } = await resolve(startupId, personId);
  const p: any = employee ?? intern;
  const checklist = await getChecklist(startupId, personId);

  const offer = p.application
    ? await prisma.offerLetter.findUnique({
        where: { applicationId: p.application.id },
        select: { offerNo: true, status: true, joiningDate: true, expiresAt: true, designation: true },
      })
    : null;

  return {
    kind,
    id: p.id,
    code: employee?.employeeCode ?? intern?.internCode,
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    designation: p.designation,
    department: p.department,
    status: p.status,
    isDirectHire: p.isDirectHire,
    onboardingCompletedAt: p.onboardingCompletedAt,
    hasAccount: Boolean(p.userId),
    avatarUrl: p.user?.avatarUrl ?? null,

    // Employee-only
    employmentType: employee?.employmentType ?? "INTERNSHIP",
    joinedAt: employee?.joinedAt ?? intern?.startDate,
    exitedAt: employee?.exitedAt ?? null,
    ctc: employee?.ctc ?? null,
    managerId: employee?.managerId ?? intern?.mentorId ?? null,

    // Intern-only
    college: intern?.college ?? null,
    stipend: intern?.stipend ?? null,
    endDate: intern?.endDate ?? null,

    /** Where they came from — null for a direct hire. */
    application: p.application
      ? {
          id: p.application.id,
          applicationNo: p.application.applicationNo,
          jobTitle: p.application.job?.title,
          appliedAt: p.application.appliedAt,
        }
      : null,
    offer,

    /** Papers they uploaded. */
    onboarding: checklist,

    /** Papers the company issued them. */
    issuedDocuments: p.documents.map((d: any) => ({
      id: d.id,
      documentNo: d.documentNo,
      docType: d.docType,
      pdfUrl: d.pdfUrl,
      issuedAt: d.issuedAt,
      revokedAt: d.revokedAt,
    })),
  };
}

/**
 * Removes someone from a startup.
 *
 * A person with issued documents is refused unless explicitly forced: an offer
 * letter or certificate already in someone's hands is a record that should not
 * silently vanish. Their uploaded documents and workspace access always go with
 * them — keeping identity papers for a deleted person would be wrong.
 */
export async function deletePerson(args: {
  startupId: string;
  personId: string;
  actorId: string;
  force?: boolean;
}) {
  const { kind, employee, intern } = await resolve(args.startupId, args.personId);
  const p: any = employee ?? intern;
  const code = employee?.employeeCode ?? intern?.internCode;

  const issued = p.documents.filter((d: any) => !d.revokedAt);
  if (issued.length > 0 && !args.force) {
    throw new AppError(
      409,
      `${p.fullName} has ${issued.length} issued document${issued.length === 1 ? "" : "s"} (${issued
        .map((d: any) => d.documentNo)
        .slice(0, 3)
        .join(", ")}). Deleting removes them permanently.`,
      "HAS_ISSUED_DOCUMENTS"
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.onboardingDocument.deleteMany({
      where: employee ? { employeeId: employee.id } : { internId: intern!.id },
    });

    if (employee) {
      await tx.attendance.deleteMany({ where: { employeeId: employee.id } });
      await tx.performanceReview.deleteMany({ where: { employeeId: employee.id } });
      await tx.hrDocument.deleteMany({ where: { employeeId: employee.id } });
      await tx.employee.delete({ where: { id: employee.id } });
    } else {
      await tx.hrDocument.deleteMany({ where: { internId: intern!.id } });
      await tx.intern.delete({ where: { id: intern!.id } });
    }

    // Revoke workspace access, but only the EMPLOYEE/INTERN membership — never
    // strip someone who is also an admin or founder of the same startup.
    await tx.startupMember.deleteMany({
      where: {
        startupId: args.startupId,
        email: p.email,
        role: { in: ["EMPLOYEE", "INTERN"] },
      },
    });
  });

  await audit({
    action: "hrms.person_deleted",
    entity: kind === "EMPLOYEE" ? "Employee" : "Intern",
    entityId: args.personId,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { code, email: p.email, fullName: p.fullName, issuedDocuments: issued.length },
  });

  return { deleted: true, code, fullName: p.fullName };
}

/** Edit the mutable parts of a person's record. */
export async function updatePerson(args: {
  startupId: string;
  personId: string;
  actorId: string;
  data: Record<string, unknown>;
}) {
  const { employee, intern } = await resolve(args.startupId, args.personId);
  const d = args.data;

  const common = {
    fullName: d.fullName as string | undefined,
    phone: d.phone as string | undefined,
    designation: d.designation as string | undefined,
    department: d.department as string | undefined,
  };
  const clean = Object.fromEntries(Object.entries(common).filter(([, v]) => v !== undefined));

  if (employee) {
    return prisma.employee.update({
      where: { id: employee.id },
      data: {
        ...clean,
        ctc: d.ctc as string | undefined,
        ...(d.joinedAt ? { joinedAt: new Date(d.joinedAt as string) } : {}),
      },
    });
  }

  return prisma.intern.update({
    where: { id: intern!.id },
    data: {
      ...clean,
      college: d.college as string | undefined,
      stipend: d.stipend as string | undefined,
      ...(d.startDate ? { startDate: new Date(d.startDate as string) } : {}),
      ...(d.endDate ? { endDate: new Date(d.endDate as string) } : {}),
    },
  });
}
