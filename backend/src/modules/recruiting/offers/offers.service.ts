import crypto from "crypto";
import { EmploymentStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { nextOfferNo, nextEmployeeCode, nextInternCode, offerExpiryFor } from "../../../lib/numbering";
import * as documents from "../../hrms/documents/document.service";
import { recordServiceStage } from "../pipeline/pipeline.service";
import { audit, AuditAction } from "../../shared/audit.service";
import { notify, notifyTenantRoles } from "../../shared/notification.service";
import { HIRING_ROLES } from "../../../lib/tenantRoles";

/** What a joiner should have ready — mirrors the onboarding checklist. */
const OFFER_DOC_CHECKLIST = [
  "Aadhaar card",
  "PAN card (for employees)",
  "College ID card (for interns)",
  "Latest marksheet",
  "Passport-size photograph",
  "Bank account details",
];
import { Emails } from "../../../lib/email/templates";

export interface GenerateOfferInput {
  startupId: string;
  startupCode: string;
  applicationId: string;
  designation: string;
  department?: string;
  ctc?: string;
  stipend?: string;
  joiningDate: Date | string;
  expiresAt?: Date | string;
  actorId: string;
}

/**
 * Idempotent by design: OfferLetter.applicationId is unique, so a double-click
 * returns the existing offer rather than burning a second fiscal-year number.
 */
export async function generate(input: GenerateOfferInput) {
  // Same guard as interviews — never assume the caller sent a real Date.
  const joiningDate = new Date(input.joiningDate);
  // Default to two days before joining when no explicit expiry is given.
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : offerExpiryFor(joiningDate);
  if (Number.isNaN(joiningDate.getTime()) || Number.isNaN(expiresAt.getTime())) {
    throw new AppError(400, "Invalid joining or expiry date", "INVALID_DATE");
  }

  const existing = await prisma.offerLetter.findUnique({
    where: { applicationId: input.applicationId },
  });
  if (existing) return { offer: existing, created: false };

  const app = await prisma.jobApplication.findFirst({
    where: { id: input.applicationId, startupId: input.startupId },
    include: {
      job: true,
      user: { select: { id: true, email: true } },
    },
  });
  if (!app) throw new AppError(404, "Application not found", "NOT_FOUND");
  if (app.outcome) throw new AppError(409, "This application is closed", "APPLICATION_CLOSED");
  if (app.stage !== "SELECTED") {
    throw new AppError(
      409,
      "Candidate must be at SELECTED before an offer can be generated",
      "INVALID_STAGE"
    );
  }
  if (joiningDate < new Date(new Date().toDateString())) {
    throw new AppError(400, "Joining date cannot be in the past", "INVALID_JOINING_DATE");
  }
  if (expiresAt <= new Date()) {
    throw new AppError(400, "Offer expiry must be in the future", "INVALID_EXPIRY");
  }

  // Fails loudly if branding is unset — better than emitting an unbranded letter.
  const branding = await documents.getBranding(input.startupId);
  const startupName = branding.legalName;
  const startupRow = await prisma.startup.findUnique({
    where: { id: input.startupId },
    select: { logoUrl: true },
  });
  const startupLogo = branding.logoUrl ?? startupRow?.logoUrl ?? null;

  const result = await prisma.$transaction(async (tx) => {
    const offerNo = await nextOfferNo(tx, input.startupId, input.startupCode);
    const acceptToken = crypto.randomBytes(32).toString("hex");

    const doc = await documents.issue(
      {
        startupId: input.startupId,
        docType: "OFFER_LETTER",
        documentNo: offerNo,
        templateKey: "OFFER_LETTER",
        applicationId: app.id,
        issuedBy: input.actorId,
        payload: {
          candidateName: app.applicantName ?? app.applicantEmail,
          designation: input.designation,
          department: input.department ?? app.job.department,
          employmentType: app.job.type,
          ctc: input.ctc,
          stipend: input.stipend ?? app.job.stipend,
          joiningDate,
          expiresAt,
          durationMonths: app.job.durationMonths,
          workMode: app.job.workMode,
          location: app.job.location,
        },
      },
      tx
    );

    const offer = await tx.offerLetter.create({
      data: {
        startupId: input.startupId,
        applicationId: app.id,
        hrDocumentId: doc.id,
        offerNo,
        designation: input.designation,
        department: input.department ?? app.job.department,
        employmentType: app.job.type,
        ctc: input.ctc,
        stipend: input.stipend ?? app.job.stipend,
        joiningDate,
        expiresAt,
        status: "SENT",
        sentAt: new Date(),
        acceptToken,
        createdBy: input.actorId,
      },
    });

    await recordServiceStage(tx, {
      startupId: input.startupId,
      applicationId: app.id,
      fromStage: app.stage,
      toStage: "OFFER_GENERATED",
      note: `Offer ${offerNo} generated`,
      actorId: input.actorId,
    });

    await audit(
      {
        action: AuditAction.OFFER_GENERATED,
        entity: "OfferLetter",
        entityId: offer.id,
        actorId: input.actorId,
        startupId: input.startupId,
        metadata: { offerNo, applicationId: app.id },
      },
      tx
    );

    return { offer, doc };
  });

  // Rendering and upload deliberately happen after the transaction has
  // committed — Chromium is far slower than Prisma's transaction budget.
  const file = await documents.attachFile(result.doc, result.doc.html);

  await notify({
    userId: app.userId,
    event: "OFFER_GENERATED",
    title: `Offer letter — ${input.designation}`,
    message: `Congratulations. Your offer (${result.offer.offerNo}) is ready. Please respond by ${expiresAt.toDateString()}.`,
    link: `/dashboard/applications/${app.id}`,
    html: Emails.offerGenerated({
      name: app.applicantName ?? "there",
      designation: input.designation,
      startupName: startupName ?? "the company",
      offerNo: result.offer.offerNo,
      joiningDate: joiningDate.toLocaleDateString("en-IN", { dateStyle: "long" }),
      expiresAt: expiresAt.toLocaleDateString("en-IN", { dateStyle: "long" }),
      ctc: input.ctc,
      stipend: input.stipend ?? app.job.stipend,
      logoUrl: startupLogo,
      reportingTo: app.job.department,
      workLocation: app.job.location,
      documentsChecklist: OFFER_DOC_CHECKLIST,
    }),
    // Candidates print these and show them to colleges, so the PDF travels
    // with the mail rather than sitting behind a login.
    attachments: file.pdfBuffer
      ? [{ filename: `Offer-Letter-${result.offer.offerNo.replace(/\//g, "-")}.pdf`, content: file.pdfBuffer }]
      : undefined,
  });

  return { offer: result.offer, created: true, pdfUrl: file.pdfUrl };
}

/**
 * Has this person actually started at the startup? Matched on the source
 * application first, falling back to email for records created before the
 * link existed (direct hires, early data).
 */
async function hasJoined(startupId: string, email: string | null, applicationId?: string) {
  const or: { applicationId?: string; email?: string }[] = [];
  if (applicationId) or.push({ applicationId });
  if (email) or.push({ email });
  if (or.length === 0) return false;

  const status = { in: [EmploymentStatus.ACTIVE, EmploymentStatus.NOTICE] };
  const [emp, intern] = await Promise.all([
    prisma.employee.findFirst({ where: { startupId, OR: or, status }, select: { id: true } }),
    prisma.intern.findFirst({ where: { startupId, OR: or, status }, select: { id: true } }),
  ]);
  return Boolean(emp || intern);
}

/** Candidate-facing. Verified by ownership, not tenancy. */
export async function respond(
  applicationId: string,
  userId: string,
  accept: boolean,
  reason?: string
) {
  const app = await prisma.jobApplication.findFirst({
    where: { id: applicationId, userId },
    include: { offer: true },
  });
  if (!app?.offer) throw new AppError(404, "Offer not found", "NOT_FOUND");
  if (!app.startupId) throw new AppError(500, "Application missing tenant", "DATA_ERROR");

  const offer = app.offer;

  /**
   * Backing out of an acceptance is a real thing candidates do, usually because
   * a better offer landed. Refusing it would trap someone in a commitment they
   * have already broken in practice, and would leave the startup holding a
   * headcount that never arrives with no signal. So a decline is allowed on an
   * accepted offer right up until they actually join — after that it is an
   * exit, which HR handles, not an offer response.
   */
  const isWithdrawal = !accept && offer.status === "ACCEPTED";

  if (isWithdrawal) {
    const joined = await hasJoined(offer.startupId, app.applicantEmail, applicationId);
    if (joined) {
      throw new AppError(
        409,
        "You have already joined. Talk to HR about leaving — this cannot be undone here.",
        "ALREADY_ONBOARDED"
      );
    }
  } else if (offer.status !== "SENT") {
    throw new AppError(409, `This offer is ${offer.status.toLowerCase()}`, "OFFER_NOT_PENDING");
  } else if (offer.expiresAt < new Date()) {
    await prisma.offerLetter.update({ where: { id: offer.id }, data: { status: "EXPIRED" } });
    throw new AppError(409, "This offer has expired", "OFFER_EXPIRED");
  }

  /**
   * A candidate can apply to several startups in the ecosystem at once, and more
   * than one may reach the offer stage. Holding two live acceptances is not a
   * state anyone can honour — the second startup would onboard someone who has
   * already committed elsewhere. So accepting is blocked while another
   * acceptance is outstanding, and the conflicting startup is named so the
   * candidate knows exactly what to decline first.
   */
  if (accept) {
    const liveAcceptances = await prisma.offerLetter.findMany({
      where: {
        status: "ACCEPTED",
        applicationId: { not: applicationId },
        application: { userId },
      },
      include: { startup: { select: { id: true, name: true } } },
    });

    // A finished engagement is not a conflict — someone who completed an
    // internship last year is free to accept a new offer now.
    let conflict: (typeof liveAcceptances)[number] | null = null;
    for (const prior of liveAcceptances) {
      const alreadyOnboarded = await hasJoined(prior.startupId, app.applicantEmail, prior.applicationId);
      const notYetOnboarded = !alreadyOnboarded && prior.joiningDate >= new Date(new Date().toDateString());

      // Conflicts are: currently engaged there, or committed to start there.
      if (alreadyOnboarded || notYetOnboarded) {
        conflict = prior;
        break;
      }
    }

    if (conflict) {
      throw new AppError(
        409,
        `You have already accepted an offer from ${conflict.startup.name} (${conflict.offerNo}) ` +
          `for ${conflict.designation}, joining ${conflict.joiningDate.toLocaleDateString("en-IN", { dateStyle: "medium" })}. ` +
          `Decline that offer first if you want to take this one instead.`,
        "OFFER_ALREADY_ACCEPTED_ELSEWHERE"
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.offerLetter.update({
      where: { id: offer.id },
      data: accept
        ? { status: "ACCEPTED", acceptedAt: new Date(), acceptToken: null }
        : { status: "DECLINED", declinedAt: new Date(), declineReason: reason, acceptToken: null },
    });

    await recordServiceStage(tx, {
      startupId: app.startupId!,
      applicationId: app.id,
      fromStage: app.stage,
      toStage: accept ? "OFFER_ACCEPTED" : app.stage,
      outcome: accept ? undefined : "OFFER_DECLINED",
      note: accept
        ? "Offer accepted by candidate"
        : isWithdrawal
          ? `Candidate withdrew after accepting: ${reason ?? "no reason given"}`
          : `Offer declined: ${reason ?? "no reason given"}`,
      actorId: userId,
    });

    await audit(
      {
        action: accept ? AuditAction.OFFER_ACCEPTED : AuditAction.OFFER_DECLINED,
        entity: "OfferLetter",
        entityId: offer.id,
        actorId: userId,
        startupId: app.startupId!,
        metadata: { offerNo: offer.offerNo, reason },
      },
      tx
    );

    return updated;
  });

  /**
   * The hiring side plans headcount around this answer, so they hear it either
   * way — and a withdrawal after acceptance is the one that actually costs them
   * a start date, so it says so plainly.
   */
  const who = app.applicantName ?? app.applicantEmail ?? "A candidate";
  await notifyTenantRoles(app.startupId, [...HIRING_ROLES], {
    event: accept ? "OFFER_ACCEPTED" : "STAGE_CHANGED",
    title: accept
      ? `${who} accepted your offer`
      : isWithdrawal
        ? `${who} withdrew after accepting`
        : `${who} declined your offer`,
    message: accept
      ? `${offer.offerNo} accepted. Joining ${offer.joiningDate.toLocaleDateString("en-IN", { dateStyle: "medium" })}.`
      : `${offer.offerNo} for ${offer.designation}. Reason: ${reason ?? "not given"}.`,
    link: `/s/${app.startupId}/applications/${app.id}`,
  });

  return result;
}

export async function revoke(
  startupId: string,
  offerId: string,
  reason: string,
  actorId: string
) {
  const offer = await prisma.offerLetter.findFirst({ where: { id: offerId, startupId } });
  if (!offer) throw new AppError(404, "Offer not found", "NOT_FOUND");
  if (["REVOKED", "DECLINED"].includes(offer.status)) {
    throw new AppError(409, `Offer already ${offer.status.toLowerCase()}`, "INVALID_STATE");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.offerLetter.update({
      where: { id: offerId },
      data: { status: "REVOKED", revokedAt: new Date(), revokeReason: reason },
    });

    if (offer.hrDocumentId) {
      await tx.hrDocument.update({
        where: { id: offer.hrDocumentId },
        data: { revokedAt: new Date(), revokeReason: reason },
      });
    }

    const app = await tx.jobApplication.findUnique({ where: { id: offer.applicationId } });
    if (app) {
      await recordServiceStage(tx, {
        startupId,
        applicationId: app.id,
        fromStage: app.stage,
        toStage: app.stage,
        outcome: "OFFER_REVOKED",
        note: reason,
        actorId,
      });
    }

    await audit(
      {
        action: AuditAction.OFFER_REVOKED,
        entity: "OfferLetter",
        entityId: offerId,
        actorId,
        startupId,
        metadata: { offerNo: offer.offerNo, reason },
      },
      tx
    );

    return updated;
  });
}

/**
 * The recruiting → HRMS handoff. Creates a permanent Employee or Intern record,
 * grants tenant membership, and closes the application as HIRED. The application
 * row itself is never mutated into an employee — both persist.
 */
export async function onboard(args: {
  startupId: string;
  startupCode: string;
  applicationId: string;
  actorId: string;
  department?: string;
  managerId?: string;
}) {
  const app = await prisma.jobApplication.findFirst({
    where: { id: args.applicationId, startupId: args.startupId },
    include: { job: true, offer: true, user: { select: { id: true, email: true } } },
  });
  if (!app) throw new AppError(404, "Application not found", "NOT_FOUND");
  if (!app.offer || app.offer.status !== "ACCEPTED") {
    throw new AppError(409, "Candidate must have an accepted offer", "OFFER_NOT_ACCEPTED");
  }

  const isIntern = app.job.type === "INTERNSHIP";
  const email = app.applicantEmail ?? "";

  // Rehire keeps the original permanent code — the brief says it never changes.
  const priorEmployee = isIntern
    ? null
    : await prisma.employee.findFirst({ where: { startupId: args.startupId, email } });

  return prisma.$transaction(async (tx) => {
    let record: any;

    if (isIntern) {
      const internCode = await nextInternCode(tx, args.startupId, args.startupCode);
      const start = app.offer!.joiningDate;
      const end = new Date(start);
      end.setMonth(end.getMonth() + (app.job.durationMonths ?? 6));

      record = await tx.intern.create({
        data: {
          startupId: args.startupId,
          internCode,
          userId: app.userId,
          applicationId: app.id,
          fullName: app.applicantName ?? email,
          email,
          phone: app.applicantPhone,
          college: app.college,
          department: args.department ?? app.job.department,
          designation: app.offer!.designation,
          mentorId: args.managerId,
          stipend: app.offer!.stipend,
          startDate: start,
          endDate: end,
        },
      });
    } else {
      record = priorEmployee
        ? await tx.employee.update({
            where: { id: priorEmployee.id },
            data: {
              status: "ACTIVE",
              exitedAt: null,
              designation: app.offer!.designation,
              joinedAt: app.offer!.joiningDate,
              applicationId: app.id,
            },
          })
        : await tx.employee.create({
            data: {
              startupId: args.startupId,
              employeeCode: await nextEmployeeCode(tx, args.startupId, args.startupCode),
              userId: app.userId,
              applicationId: app.id,
              fullName: app.applicantName ?? email,
              email,
              phone: app.applicantPhone,
              department: args.department ?? app.job.department,
              designation: app.offer!.designation,
              employmentType: app.job.type,
              joinedAt: app.offer!.joiningDate,
              managerId: args.managerId,
              ctc: app.offer!.ctc,
            },
          });
    }

    // Grant workspace access at the right privilege level.
    if (app.userId && email) {
      await tx.startupMember.upsert({
        where: { startupId_email: { startupId: args.startupId, email } },
        create: {
          startupId: args.startupId,
          userId: app.userId,
          email,
          role: isIntern ? "INTERN" : "EMPLOYEE",
          status: "ACTIVE",
          invitedBy: args.actorId,
          inviteToken: crypto.randomBytes(24).toString("hex"),
          joinedAt: new Date(),
        },
        update: { userId: app.userId, status: "ACTIVE", joinedAt: new Date() },
      });
    }

    await recordServiceStage(tx, {
      startupId: args.startupId,
      applicationId: app.id,
      fromStage: app.stage,
      toStage: "ONBOARDED",
      outcome: "HIRED",
      note: `Onboarded as ${isIntern ? record.internCode : record.employeeCode}`,
      actorId: args.actorId,
    });

    await tx.jobApplication.update({ where: { id: app.id }, data: { status: "HIRED" } });

    await audit(
      {
        action: AuditAction.CANDIDATE_ONBOARDED,
        entity: isIntern ? "Intern" : "Employee",
        entityId: record.id,
        actorId: args.actorId,
        startupId: args.startupId,
        metadata: { code: isIntern ? record.internCode : record.employeeCode, applicationId: app.id },
      },
      tx
    );

    return record;
  });
}
