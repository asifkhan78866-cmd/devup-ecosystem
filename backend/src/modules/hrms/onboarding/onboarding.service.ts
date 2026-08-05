import { OnboardingDocType, Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { uploadFile } from "../../../lib/storage";
import { env } from "../../../config/env";
import { audit } from "../../shared/audit.service";
import { notify } from "../../shared/notification.service";
import { Emails } from "../../../lib/email/templates";
import { SITE_URL } from "../../../lib/email/layout";

/**
 * Collection and verification of the documents a joiner provides.
 *
 * Distinct from HrDocument, which is what the company issues *to* them. These
 * are identity and education papers the company needs *from* them before
 * onboarding is considered complete.
 */

export const DOC_LABELS: Record<OnboardingDocType, string> = {
  AADHAAR: "Aadhaar card",
  PAN: "PAN card",
  PHOTO: "Passport-size photograph",
  COLLEGE_ID: "College ID card",
  MARKSHEET: "Latest marksheet",
  DEGREE_CERTIFICATE: "Degree certificate",
  RESUME: "Updated resume",
  BANK_DETAILS: "Bank account details / cancelled cheque",
  ADDRESS_PROOF: "Address proof",
  EXPERIENCE_LETTER_PREV: "Previous experience letter",
  RELIEVING_LETTER_PREV: "Previous relieving letter",
  OTHER: "Other document",
};

/**
 * Sensible defaults so a startup never faces an empty checklist. Interns are
 * asked for a college ID; employees for PAN and bank details, since they are
 * on payroll. Anything genuinely optional is marked so, because a missing
 * optional document must not block someone from starting work.
 */
const DEFAULT_REQUIREMENTS: Array<{
  docType: OnboardingDocType;
  isRequired: boolean;
  appliesTo: "BOTH" | "EMPLOYEE" | "INTERN";
  sortOrder: number;
}> = [
  { docType: "PHOTO", isRequired: true, appliesTo: "BOTH", sortOrder: 1 },
  { docType: "AADHAAR", isRequired: true, appliesTo: "BOTH", sortOrder: 2 },
  { docType: "PAN", isRequired: true, appliesTo: "EMPLOYEE", sortOrder: 3 },
  { docType: "COLLEGE_ID", isRequired: true, appliesTo: "INTERN", sortOrder: 4 },
  { docType: "MARKSHEET", isRequired: true, appliesTo: "BOTH", sortOrder: 5 },
  { docType: "DEGREE_CERTIFICATE", isRequired: false, appliesTo: "EMPLOYEE", sortOrder: 6 },
  { docType: "RESUME", isRequired: true, appliesTo: "BOTH", sortOrder: 7 },
  { docType: "BANK_DETAILS", isRequired: true, appliesTo: "EMPLOYEE", sortOrder: 8 },
  { docType: "ADDRESS_PROOF", isRequired: false, appliesTo: "BOTH", sortOrder: 9 },
  { docType: "EXPERIENCE_LETTER_PREV", isRequired: false, appliesTo: "EMPLOYEE", sortOrder: 10 },
  { docType: "RELIEVING_LETTER_PREV", isRequired: false, appliesTo: "EMPLOYEE", sortOrder: 11 },
];

/** Idempotent — safe to call on every checklist read. */
export async function ensureRequirements(startupId: string) {
  const existing = await prisma.onboardingRequirement.count({ where: { startupId } });
  if (existing > 0) return;

  await prisma.onboardingRequirement.createMany({
    data: DEFAULT_REQUIREMENTS.map((r) => ({
      startupId,
      docType: r.docType,
      label: DOC_LABELS[r.docType],
      isRequired: r.isRequired,
      appliesTo: r.appliesTo,
      sortOrder: r.sortOrder,
    })),
    skipDuplicates: true,
  });
}

export async function getRequirements(startupId: string, kind: "EMPLOYEE" | "INTERN") {
  await ensureRequirements(startupId);
  const all = await prisma.onboardingRequirement.findMany({
    where: { startupId },
    orderBy: { sortOrder: "asc" },
  });
  return all.filter((r) => r.appliesTo === "BOTH" || r.appliesTo === kind);
}

async function resolvePerson(startupId: string, personId: string) {
  const employee = await prisma.employee.findFirst({ where: { id: personId, startupId } });
  if (employee) return { kind: "EMPLOYEE" as const, employee, intern: null, person: employee };

  const intern = await prisma.intern.findFirst({ where: { id: personId, startupId } });
  if (intern) return { kind: "INTERN" as const, employee: null, intern, person: intern };

  throw new AppError(404, "Person not found in this startup", "NOT_FOUND");
}

/**
 * The checklist for one person: every requirement, merged with whatever they
 * have already uploaded, so the UI can render one list rather than reconciling
 * two.
 */
export async function getChecklist(startupId: string, personId: string) {
  const { kind, employee, intern, person } = await resolvePerson(startupId, personId);
  const requirements = await getRequirements(startupId, kind);

  const uploaded = await prisma.onboardingDocument.findMany({
    where: {
      startupId,
      ...(employee ? { employeeId: employee.id } : { internId: intern!.id }),
    },
    orderBy: { createdAt: "desc" },
  });

  const byType = new Map(uploaded.map((d) => [d.docType, d]));

  const items = requirements.map((r) => {
    const doc = byType.get(r.docType);
    return {
      docType: r.docType,
      label: r.label,
      isRequired: r.isRequired,
      status: doc?.status ?? "PENDING",
      fileUrl: doc?.fileUrl ?? null,
      fileName: doc?.fileName ?? null,
      rejectReason: doc?.rejectReason ?? null,
      submittedAt: doc?.submittedAt ?? null,
      reviewedAt: doc?.reviewedAt ?? null,
      documentId: doc?.id ?? null,
    };
  });

  const required = items.filter((i) => i.isRequired);
  const approvedRequired = required.filter((i) => i.status === "APPROVED").length;

  return {
    person: {
      id: person.id,
      kind,
      fullName: person.fullName,
      email: person.email,
      code: employee?.employeeCode ?? intern?.internCode,
      onboardingCompletedAt: employee?.onboardingCompletedAt ?? intern?.onboardingCompletedAt ?? null,
      isDirectHire: employee?.isDirectHire ?? intern?.isDirectHire ?? false,
    },
    items,
    progress: {
      requiredTotal: required.length,
      requiredApproved: approvedRequired,
      percent: required.length ? Math.round((approvedRequired / required.length) * 100) : 100,
      complete: approvedRequired === required.length,
      awaitingReview: items.filter((i) => i.status === "SUBMITTED").length,
      rejected: items.filter((i) => i.status === "REJECTED").length,
    },
  };
}

export async function uploadDocument(args: {
  startupId: string;
  personId: string;
  docType: OnboardingDocType;
  file: Express.Multer.File;
  actorId: string;
}) {
  const { employee, intern, kind } = await resolvePerson(args.startupId, args.personId);

  const requirements = await getRequirements(args.startupId, kind);
  const requirement = requirements.find((r) => r.docType === args.docType);

  const url = await uploadFile(
    env.STORAGE_BUCKET_DOCUMENTS,
    `onboarding/${args.startupId}/${args.personId}/${args.docType}-${Date.now()}-${args.file.originalname}`,
    args.file.buffer,
    args.file.mimetype
  );

  // One row per person per document type — re-uploading replaces the previous
  // file and resets the review, which is what a rejected document needs.
  const existing = await prisma.onboardingDocument.findFirst({
    where: {
      startupId: args.startupId,
      docType: args.docType,
      ...(employee ? { employeeId: employee.id } : { internId: intern!.id }),
    },
  });

  const data = {
    startupId: args.startupId,
    employeeId: employee?.id ?? null,
    internId: intern?.id ?? null,
    docType: args.docType,
    label: requirement?.label ?? DOC_LABELS[args.docType],
    isRequired: requirement?.isRequired ?? true,
    fileUrl: url,
    fileName: args.file.originalname,
    fileSize: args.file.size,
    mimeType: args.file.mimetype,
    status: "SUBMITTED" as const,
    rejectReason: null,
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
  };

  const saved = existing
    ? await prisma.onboardingDocument.update({ where: { id: existing.id }, data })
    : await prisma.onboardingDocument.create({ data });

  await audit({
    action: "onboarding.document_uploaded",
    entity: "OnboardingDocument",
    entityId: saved.id,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { docType: args.docType, personId: args.personId },
  });

  return saved;
}

export async function reviewDocument(args: {
  startupId: string;
  documentId: string;
  approve: boolean;
  reason?: string;
  actorId: string;
}) {
  const doc = await prisma.onboardingDocument.findFirst({
    where: { id: args.documentId, startupId: args.startupId },
    include: {
      employee: { select: { id: true, fullName: true, userId: true, employeeCode: true } },
      intern: { select: { id: true, fullName: true, userId: true, internCode: true } },
      startup: { select: { name: true, code: true, logoUrl: true } },
    },
  });
  if (!doc) throw new AppError(404, "Document not found", "NOT_FOUND");
  if (doc.status === "PENDING") {
    throw new AppError(409, "Nothing uploaded for this document yet", "NOT_SUBMITTED");
  }
  if (!args.approve && !args.reason?.trim()) {
    throw new AppError(400, "Give a reason so the person knows what to fix", "REASON_REQUIRED");
  }

  const updated = await prisma.onboardingDocument.update({
    where: { id: args.documentId },
    data: {
      status: args.approve ? "APPROVED" : "REJECTED",
      rejectReason: args.approve ? null : args.reason,
      reviewedAt: new Date(),
      reviewedBy: args.actorId,
    },
  });

  await audit({
    action: args.approve ? "onboarding.document_approved" : "onboarding.document_rejected",
    entity: "OnboardingDocument",
    entityId: updated.id,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { docType: doc.docType, reason: args.reason },
  });

  const subject = doc.employee ?? doc.intern;
  const personId = subject?.id;

  if (!args.approve && subject?.userId) {
    await notify({
      userId: subject.userId,
      event: "STAGE_CHANGED",
      title: "A document needs re-uploading",
      message: `Your ${doc.label ?? doc.docType} was not accepted: ${args.reason}`,
      link: "/dashboard/onboarding",
      html: Emails.documentRejected({
        name: subject.fullName,
        startupName: doc.startup.name,
        document: doc.label ?? String(doc.docType),
        reason: args.reason ?? "",
        uploadUrl: `${SITE_URL}/dashboard/onboarding`,
        logoUrl: doc.startup.logoUrl,
      }),
    });
  }

  // Approving the last outstanding requirement completes onboarding.
  if (args.approve && personId) {
    const checklist = await getChecklist(args.startupId, personId);
    if (checklist.progress.complete && !checklist.person.onboardingCompletedAt) {
      const now = new Date();
      if (doc.employeeId) {
        await prisma.employee.update({ where: { id: doc.employeeId }, data: { onboardingCompletedAt: now } });
      } else if (doc.internId) {
        await prisma.intern.update({ where: { id: doc.internId }, data: { onboardingCompletedAt: now } });
      }

      if (subject?.userId) {
        await notify({
          userId: subject.userId,
          event: "JOINED",
          title: "Your onboarding is complete",
          message: "All your documents have been verified.",
          link: "/dashboard",
          html: Emails.onboardingComplete({
            name: subject.fullName,
            startupName: doc.startup.name,
            employeeCode: checklist.person.code ?? "",
            logoUrl: doc.startup.logoUrl,
          }),
        });
      }
    }
  }

  return updated;
}

/** Nudges someone to upload what is still outstanding. */
export async function requestDocuments(args: {
  startupId: string;
  personId: string;
  actorId: string;
}) {
  const checklist = await getChecklist(args.startupId, args.personId);
  const outstanding = checklist.items
    .filter((i) => i.status === "PENDING" || i.status === "REJECTED")
    .map((i) => i.label + (i.isRequired ? "" : " (optional)"));

  if (outstanding.length === 0) {
    throw new AppError(409, "Nothing outstanding for this person", "NOTHING_TO_REQUEST");
  }

  const { employee, intern } = await resolvePerson(args.startupId, args.personId);
  const subject = employee ?? intern!;
  const startup = await prisma.startup.findUnique({
    where: { id: args.startupId },
    select: { name: true, logoUrl: true },
  });

  await notify({
    userId: subject.userId ?? undefined,
    email: subject.email,
    event: "STAGE_CHANGED",
    title: `Documents needed — ${startup?.name}`,
    message: `Please upload: ${outstanding.join(", ")}`,
    link: "/dashboard/onboarding",
    html: Emails.documentsRequested({
      name: subject.fullName,
      startupName: startup?.name ?? "your organisation",
      uploadUrl: `${SITE_URL}/dashboard/onboarding`,
      documents: outstanding,
      logoUrl: startup?.logoUrl,
    }),
  });

  await audit({
    action: "onboarding.documents_requested",
    entity: employee ? "Employee" : "Intern",
    entityId: args.personId,
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { outstanding },
  });

  return { requested: outstanding };
}

/** Everyone still mid-onboarding, for the HR overview. */
export async function pendingOnboarding(startupId: string) {
  const [employees, interns] = await Promise.all([
    prisma.employee.findMany({
      where: { startupId, status: "ACTIVE", onboardingCompletedAt: null },
      select: { id: true, fullName: true, email: true, employeeCode: true, joinedAt: true, isDirectHire: true },
      orderBy: { joinedAt: "desc" },
    }),
    prisma.intern.findMany({
      where: { startupId, status: "ACTIVE", onboardingCompletedAt: null },
      select: { id: true, fullName: true, email: true, internCode: true, startDate: true, isDirectHire: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  const withProgress = await Promise.all(
    [
      ...employees.map((e) => ({ ...e, kind: "EMPLOYEE" as const, code: e.employeeCode })),
      ...interns.map((i) => ({ ...i, kind: "INTERN" as const, code: i.internCode })),
    ].map(async (p) => {
      const c = await getChecklist(startupId, p.id);
      return { ...p, progress: c.progress };
    })
  );

  return withProgress;
}
