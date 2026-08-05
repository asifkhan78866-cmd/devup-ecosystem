import crypto from "crypto";
import { JobType } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { nextEmployeeCode, nextInternCode } from "../../../lib/numbering";
import { audit } from "../../shared/audit.service";
import { notify } from "../../shared/notification.service";
import { Emails } from "../../../lib/email/templates";
import { SITE_URL } from "../../../lib/email/layout";
import { getChecklist, requestDocuments } from "./onboarding.service";
import * as documents from "../documents/document.service";
import { nextOfferNo, offerExpiryFor } from "../../../lib/numbering";

/**
 * Adds someone who was hired before this system existed, or outside it.
 *
 * They get the same permanent code, the same document checklist and the same
 * workspace access as a pipeline hire — the only difference is there is no
 * application or offer behind them, which `isDirectHire` records honestly
 * rather than fabricating a fake pipeline history.
 */

export interface DirectHireInput {
  startupId: string;
  startupCode: string;
  actorId: string;

  fullName: string;
  email: string;
  phone?: string;
  designation: string;
  department?: string;
  employmentType: JobType;

  /** Employees join on a date; interns have a fixed window. */
  joinedAt: string | Date;
  endDate?: string | Date;

  college?: string;
  ctc?: string;
  stipend?: string;
  managerId?: string;

  /** Email them the document checklist straight away. */
  requestDocuments?: boolean;
  /**
   * Issue a numbered offer letter and email the PDF. Off by default because a
   * long-standing employee usually does not need a fresh offer letter, but it
   * is exactly what a newly selected person expects.
   */
  issueOfferLetter?: boolean;
  workMode?: string;
  location?: string;
}

export async function createDirectHire(input: DirectHireInput) {
  const isIntern = input.employmentType === "INTERNSHIP";
  const email = input.email.trim().toLowerCase();
  const joinedAt = new Date(input.joinedAt);

  if (Number.isNaN(joinedAt.getTime())) {
    throw new AppError(400, "Invalid joining date", "INVALID_DATE");
  }

  // Same person cannot exist twice in one startup, in either table.
  const [dupEmployee, dupIntern] = await Promise.all([
    prisma.employee.findFirst({ where: { startupId: input.startupId, email } }),
    prisma.intern.findFirst({ where: { startupId: input.startupId, email } }),
  ]);
  if (dupEmployee || dupIntern) {
    throw new AppError(
      409,
      `${email} is already on this startup's team`,
      "ALREADY_EXISTS"
    );
  }

  // Link to an existing DevUp account when there is one, so they see their
  // onboarding checklist on their own dashboard.
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  let endDate: Date | null = null;
  if (isIntern) {
    endDate = input.endDate ? new Date(input.endDate) : new Date(joinedAt);
    if (!input.endDate) endDate.setMonth(endDate.getMonth() + 6);
    if (endDate <= joinedAt) {
      throw new AppError(400, "Internship end date must be after the start date", "INVALID_DATE");
    }
  }

  const record = await prisma.$transaction(async (tx) => {
    if (isIntern) {
      const internCode = await nextInternCode(tx, input.startupId, input.startupCode);
      return tx.intern.create({
        data: {
          startupId: input.startupId,
          internCode,
          userId: user?.id,
          fullName: input.fullName.trim(),
          email,
          phone: input.phone,
          college: input.college,
          department: input.department,
          designation: input.designation,
          mentorId: input.managerId,
          stipend: input.stipend,
          startDate: joinedAt,
          endDate: endDate!,
          isDirectHire: true,
        },
      });
    }

    const employeeCode = await nextEmployeeCode(tx, input.startupId, input.startupCode);
    return tx.employee.create({
      data: {
        startupId: input.startupId,
        employeeCode,
        userId: user?.id,
        fullName: input.fullName.trim(),
        email,
        phone: input.phone,
        department: input.department,
        designation: input.designation,
        employmentType: input.employmentType,
        joinedAt,
        managerId: input.managerId,
        ctc: input.ctc,
        isDirectHire: true,
      },
    });
  });

  // Workspace access at the right level, same as a pipeline hire.
  await prisma.startupMember.upsert({
    where: { startupId_email: { startupId: input.startupId, email } },
    create: {
      startupId: input.startupId,
      userId: user?.id,
      email,
      role: isIntern ? "INTERN" : "EMPLOYEE",
      status: user ? "ACTIVE" : "INVITED",
      invitedBy: input.actorId,
      inviteToken: crypto.randomBytes(24).toString("hex"),
      joinedAt: user ? new Date() : null,
    },
    update: { userId: user?.id, role: isIntern ? "INTERN" : "EMPLOYEE" },
  });

  const code = isIntern ? (record as any).internCode : (record as any).employeeCode;

  await audit({
    action: "hrms.direct_hire_added",
    entity: isIntern ? "Intern" : "Employee",
    entityId: record.id,
    actorId: input.actorId,
    startupId: input.startupId,
    metadata: { code, email, designation: input.designation },
  });

  const startup = await prisma.startup.findUnique({
    where: { id: input.startupId },
    select: { name: true, logoUrl: true },
  });

  // Always welcome them; the checklist mail is separate and opt-in.
  await notify({
    userId: user?.id,
    email,
    event: "JOINED",
    title: `Welcome to ${startup?.name}`,
    message: `You have been added to ${startup?.name}. Your ID is ${code}.`,
    link: "/dashboard",
    html: Emails.joined({
      name: input.fullName,
      startupName: startup?.name ?? "the team",
      employeeCode: code,
      designation: input.designation,
      logoUrl: startup?.logoUrl,
    }),
  });

  if (input.requestDocuments) {
    // Non-fatal: the person exists whether or not the nudge sends.
    await requestDocuments({
      startupId: input.startupId,
      personId: record.id,
      actorId: input.actorId,
    }).catch(() => undefined);
  }

  // Optional offer letter — issued through the same generator and numbering as
  // a pipeline offer, so the sequence stays continuous and auditable.
  let offerLetter: { offerNo: string; pdfUrl: string | null } | null = null;

  if (input.issueOfferLetter) {
    try {
      const offerNo = await prisma.$transaction((tx) =>
        nextOfferNo(tx, input.startupId, input.startupCode)
      );

      const doc = await documents.issueAndAttach({
        startupId: input.startupId,
        docType: "OFFER_LETTER",
        documentNo: offerNo,
        templateKey: "OFFER_LETTER",
        employeeId: isIntern ? undefined : record.id,
        internId: isIntern ? record.id : undefined,
        issuedBy: input.actorId,
        payload: {
          candidateName: input.fullName,
          designation: input.designation,
          department: input.department,
          employmentType: input.employmentType,
          ctc: input.ctc,
          stipend: input.stipend,
          joiningDate: joinedAt,
          expiresAt: offerExpiryFor(joinedAt),
          documentsDueBy: offerExpiryFor(joinedAt),
          durationMonths: isIntern && endDate
            ? Math.max(1, Math.round((endDate.getTime() - joinedAt.getTime()) / (30 * 864e5)))
            : undefined,
          workMode: input.workMode ?? "OFFICE",
          location: input.location,
        },
      });

      offerLetter = { offerNo, pdfUrl: doc.pdfUrl };

      await notify({
        userId: user?.id,
        email,
        event: "OFFER_GENERATED",
        title: `Your offer letter — ${input.designation}`,
        message: `${startup?.name} has issued your offer letter (${offerNo}).`,
        link: "/dashboard/onboarding",
        html: Emails.offerGenerated({
          name: input.fullName,
          designation: input.designation,
          startupName: startup?.name ?? "the team",
          offerNo,
          joiningDate: joinedAt.toLocaleDateString("en-IN", { dateStyle: "long" }),
          expiresAt: offerExpiryFor(joinedAt).toLocaleDateString("en-IN", { dateStyle: "long" }),
          ctc: input.ctc,
          stipend: input.stipend,
          logoUrl: startup?.logoUrl,
          workLocation: input.location,
          reportingTo: input.department,
        }),
        attachments: doc.pdfBuffer
          ? [{ filename: `Offer-Letter-${offerNo.replace(/\//g, "-")}.pdf`, content: doc.pdfBuffer }]
          : undefined,
      });
    } catch (err) {
      // Branding missing or Chromium unavailable — the person is still created.
      offerLetter = null;
    }
  }

  const checklist = await getChecklist(input.startupId, record.id);

  return { record, code, kind: isIntern ? "INTERN" : "EMPLOYEE", checklist, offerLetter };
}

/**
 * Bulk import for the people already hired before this system existed.
 * Each row succeeds or fails independently so one bad email does not abort the
 * whole import — the caller gets a per-row report.
 */
export async function bulkDirectHire(args: {
  startupId: string;
  startupCode: string;
  actorId: string;
  rows: Array<Omit<DirectHireInput, "startupId" | "startupCode" | "actorId">>;
  requestDocuments?: boolean;
}) {
  const created: Array<{ email: string; code: string }> = [];
  const failed: Array<{ email: string; reason: string }> = [];

  for (const row of args.rows) {
    try {
      const res = await createDirectHire({
        ...row,
        startupId: args.startupId,
        startupCode: args.startupCode,
        actorId: args.actorId,
        requestDocuments: args.requestDocuments ?? row.requestDocuments,
      });
      created.push({ email: row.email, code: res.code });
    } catch (err) {
      failed.push({ email: row.email, reason: (err as Error).message });
    }
  }

  await audit({
    action: "hrms.bulk_import",
    entity: "Employee",
    actorId: args.actorId,
    startupId: args.startupId,
    metadata: { attempted: args.rows.length, created: created.length, failed: failed.length },
  });

  return { created, failed, total: args.rows.length };
}
