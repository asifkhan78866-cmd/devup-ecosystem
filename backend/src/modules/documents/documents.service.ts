import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { uploadFile } from "../../lib/storage";
import { env } from "../../config/env";
import { sendDocumentReadyEmail, sendDocumentSignedEmail } from "../../lib/resend";

export async function sendDocumentToStartup(params: {
  startupId: string;
  type: any; // DocType enum
  name: string;
  fileUrl: string;
  sentBy: string;
}) {
  const doc = await prisma.document.create({
    data: {
      startupId: params.startupId,
      type: params.type,
      name: params.name,
      fileUrl: params.fileUrl,
      status: 'PENDING',
      sentToStartupAt: new Date(),
    },
  });

  const founders = await prisma.startupMember.findMany({
    where: { 
      startupId: params.startupId, status: 'ACTIVE',
      role: { in: ['Founder', 'Co-Founder'] },
    },
    include: { user: true },
  });

  for (const founder of founders) {
    if (!founder.userId) continue;
    await prisma.notification.create({
      data: {
        userId: founder.userId,
        title: 'New document to sign',
        message: `${params.name} requires your signature.`,
        type: 'DOCUMENT_PENDING',
        link: `/dashboard/documents`,
      },
    });
    await sendDocumentReadyEmail(founder.user!.email, params.name);
  }

  await prisma.auditLog.create({
    data: {
      adminId: params.sentBy,
      action: 'SEND_DOCUMENT',
      entity: 'Document',
      entityId: doc.id,
      metadata: { startupId: params.startupId },
    },
  });

  return doc;
}

export async function signDocument(params: {
  documentId: string;
  userId: string;
  signatureDataUrl: string;
  ipAddress: string;
  userAgent: string;
}) {
  const doc = await prisma.document.findUnique({
    where: { id: params.documentId },
  });
  
  if (!doc) throw new AppError(404, 'Document not found');
  if (doc.status === 'SIGNED') {
    throw new AppError(400, 'This document has already been signed');
  }

  const member = await prisma.startupMember.findFirst({
    where: {
      startupId: doc.startupId!,
      userId: params.userId,
      status: 'ACTIVE',
      role: { in: ['Founder', 'Co-Founder'] },
    },
    include: { user: { include: { profile: true } } },
  });

  if (!member) {
    throw new AppError(403, 'Only an authorized founder of this startup can sign this document');
  }

  const signerName = member.user!.profile?.name ?? member.user!.email;

  const signed = await prisma.document.update({
    where: { id: params.documentId },
    data: {
      status: 'SIGNED',
      signedByFounder: true,
      founderSignedAt: new Date(),
      signedByUserId: params.userId,
      signedByName: signerName,
      signatureDataUrl: params.signatureDataUrl,
      ipAddress: params.ipAddress,
      signedUserAgent: params.userAgent,
    },
  });

  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Document signed',
        message: `${signerName} signed ${doc.name}.`,
        type: 'DOCUMENT_SIGNED',
        link: `/admin/documents`,
      },
    });
  }
  
  await sendDocumentSignedEmail(process.env.RESEND_FROM_EMAIL || 'admin@devup.com', doc.name, signerName);

  await prisma.auditLog.create({
    data: {
      adminId: null,
      action: 'SIGN_DOCUMENT',
      entity: 'Document',
      entityId: doc.id,
      metadata: { signedBy: params.userId, startupId: doc.startupId },
    },
  });

  return signed;
}
