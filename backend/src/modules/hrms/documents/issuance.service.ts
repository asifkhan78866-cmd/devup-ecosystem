import { HrDocType } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../middleware/errorHandler";
import { nextSequence, fiscalYear } from "../../../lib/numbering";
import * as documents from "./document.service";
import { notify } from "../../shared/notification.service";
import { TemplateKey } from "./templates";

/**
 * Issues the non-offer HR documents. Offer letters go through offers.service,
 * but every type ends up in the same generator (document.service.issue) so there
 * is exactly one place that renders and numbers a document.
 */

const DOC_ABBR: Record<Exclude<HrDocType, "OFFER_LETTER" | "FOUNDER_LETTER">, string> = {
  EXPERIENCE_LETTER: "EXP",
  LOR: "LOR",
  CERTIFICATE: "CERT",
  ID_CARD: "ID",
  RELIEVING: "REL",
};

export interface IssueRequest {
  startupId: string;
  startupCode: string;
  // Offer letters and founder letters have their own issuers, because each
  // attaches to a different record and carries its own numbering series.
  docType: Exclude<HrDocType, "OFFER_LETTER" | "FOUNDER_LETTER">;
  employeeId?: string;
  internId?: string;
  actorId: string;
  extra?: Record<string, unknown>;
}

export async function issueDocument(req: IssueRequest) {
  if (!req.employeeId && !req.internId) {
    throw new AppError(400, "Select an employee or intern", "SUBJECT_REQUIRED");
  }

  const employee = req.employeeId
    ? await prisma.employee.findFirst({ where: { id: req.employeeId, startupId: req.startupId } })
    : null;
  const intern = req.internId
    ? await prisma.intern.findFirst({ where: { id: req.internId, startupId: req.startupId } })
    : null;

  const subject = employee ?? intern;
  if (!subject) throw new AppError(404, "Person not found in this startup", "NOT_FOUND");

  // Documents that assert a completed tenure need an actual end date.
  if (req.docType === "EXPERIENCE_LETTER") {
    if (!employee) throw new AppError(400, "Experience letters are for employees. Interns receive certificates.", "WRONG_SUBJECT");
    if (!employee.exitedAt) throw new AppError(409, "Set the employee's exit date before issuing an experience letter", "NO_EXIT_DATE");
  }
  if (req.docType === "RELIEVING" && employee && !employee.exitedAt) {
    throw new AppError(409, "Set the employee's exit date before issuing a relieving letter", "NO_EXIT_DATE");
  }

  const documentNo = await prisma.$transaction(async (tx) => {
    const fy = fiscalYear();
    const n = await nextSequence(tx, req.startupId, `DOC_${req.docType}` as never, fy);
    return `DEVUP/${req.startupCode}/${DOC_ABBR[req.docType]}/${fy}/${String(n).padStart(4, "0")}`;
  });

  const payload: Record<string, unknown> = {
    fullName: subject.fullName,
    designation: subject.designation,
    department: (subject as any).department,
    employeeCode: employee?.employeeCode,
    internCode: intern?.internCode,
    college: intern?.college,
    joinedAt: employee?.joinedAt,
    exitedAt: employee?.exitedAt,
    startDate: intern?.startDate ?? employee?.joinedAt,
    endDate: intern?.endDate ?? employee?.exitedAt,
    certificateType: intern ? "Internship" : "Employment",
    ...req.extra,
  };

  const doc = await documents.issueAndAttach({
    startupId: req.startupId,
    docType: req.docType,
    documentNo,
    templateKey: req.docType as TemplateKey,
    payload,
    employeeId: employee?.id,
    internId: intern?.id,
    issuedBy: req.actorId,
  });

  const userId = (subject as any).userId;
  if (userId) {
    await notify({
      userId,
      event: "STAGE_CHANGED",
      title: `Your ${label(req.docType)} is ready`,
      message: `${documentNo} has been issued by your organisation.`,
      link: "/dashboard",
    });
  }

  return doc;
}

function label(t: HrDocType) {
  return t.replace(/_/g, " ").toLowerCase();
}

/** Marks an employee as exited so exit documents become available. */
export async function recordExit(args: {
  db: any;
  startupId: string;
  employeeId: string;
  exitedAt: string | Date;
  status?: "EXITED" | "TERMINATED";
  actorId: string;
}) {
  const employee = await args.db.employee.findFirst({ where: { id: args.employeeId } });
  if (!employee) throw new AppError(404, "Employee not found", "NOT_FOUND");

  const exitedAt = new Date(args.exitedAt);
  if (exitedAt < new Date(employee.joinedAt)) {
    throw new AppError(400, "Exit date cannot precede the joining date", "INVALID_EXIT_DATE");
  }

  return args.db.employee.update({
    where: { id: args.employeeId },
    data: { exitedAt, status: args.status ?? "EXITED" },
  });
}
