import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { uploadFile } from "../../lib/storage";
import { env } from "../../config/env";
import { resend, EmailTemplates } from "../../lib/resend";

export class DocumentsService {
  async uploadDocument(adminId: string, data: any, fileBuffer: Buffer, mimetype: string) {
    const startup = await prisma.startup.findUnique({
      where: { id: data.startupId },
      include: { primaryFounder: true }
    });

    if (!startup) throw new AppError(404, "Startup not found");

    const path = `documents/${startup.id}/${data.type}-${Date.now()}.pdf`;
    const url = await uploadFile(env.STORAGE_BUCKET_DOCUMENTS, path, fileBuffer, mimetype);

    const document = await prisma.document.create({
      data: {
        startupId: startup.id,
        type: data.type,
        name: data.name,
        fileUrl: url,
      }
    });

    if (startup.primaryFounder?.email) {
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: startup.primaryFounder.email,
        subject: "New Document Requires Signature - DevUp Ecosystem",
        html: EmailTemplates.documentReady("Founder", data.name, `${env.FRONTEND_URL}/dashboard/documents`)
      }).catch(err => console.error("Email error:", err));
    }

    return document;
  }

  async getDocument(id: string, userId: string, role: string) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: { startup: { include: { founders: true } } }
    });

    if (!document) throw new AppError(404, "Document not found");

    if (role !== "ADMIN" && !document.startup.founders.some(f => f.id === userId)) {
      throw new AppError(403, "Not authorized to view this document");
    }

    return document;
  }

  async signDocument(id: string, userId: string, role: string) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: { startup: { include: { primaryFounder: true, founders: true } } }
    });

    if (!document) throw new AppError(404, "Document not found");

    const updateData: any = {};

    if (role === "ADMIN") {
      updateData.signedByAdmin = true;
      updateData.adminSignedAt = new Date();
    } else if (document.startup.founders.some(f => f.id === userId)) {
      updateData.signedByFounder = true;
      updateData.founderSignedAt = new Date();
    } else {
      throw new AppError(403, "Not authorized to sign this document");
    }

    // If both signed, status is SIGNED
    if ((updateData.signedByAdmin || document.signedByAdmin) && (updateData.signedByFounder || document.signedByFounder)) {
      updateData.status = "SIGNED";
    }

    const updated = await prisma.document.update({
      where: { id },
      data: updateData
    });

    if (updateData.status === "SIGNED") {
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: env.RESEND_TEAM_EMAIL,
        subject: "Document Fully Signed",
        html: EmailTemplates.documentSigned(document.startup.name, document.name)
      }).catch(err => console.error("Email error:", err));
    }

    return updated;
  }
}
