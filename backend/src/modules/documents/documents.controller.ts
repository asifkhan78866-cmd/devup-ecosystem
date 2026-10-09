import { Request, Response } from "express";
import { sendDocumentToStartup, signDocument as signDocService } from "./documents.service";
import { AppError } from "../../middleware/errorHandler";
import { env } from "../../config/env";
import { uploadFile } from "../../lib/storage";
import { objectKey, verifyUpload } from "../../lib/uploads";
import { prisma } from "../../lib/prisma";

export class DocumentsController {
  async uploadDocument(req: Request, res: Response) {
    const pdf = verifyUpload(req.file, "document");
    const path = objectKey(["documents", req.body.startupId], req.body.type, pdf.ext);
    const fileUrl = await uploadFile(env.STORAGE_BUCKET_DOCUMENTS, path, pdf.buffer, pdf.mime);

    const data = await sendDocumentToStartup({
      startupId: req.body.startupId,
      type: req.body.type,
      name: req.body.name,
      fileUrl,
      sentBy: req.user!.id,
    });
    res.status(201).json({ success: true, data });
  }

  async getDocument(req: Request, res: Response) {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id as string },
      include: { startup: true }
    });

    if (!document) throw new AppError(404, "Document not found");

    if (req.user!.role !== "ADMIN") {
      const isMember = await prisma.startupMember.findFirst({
        where: { startupId: document.startupId, userId: req.user!.id, status: 'ACTIVE' }
      });
      if (!isMember) throw new AppError(403, "Not authorized to view this document");
    }

    res.status(200).json({ success: true, data: document });
  }

  async signDocument(req: Request, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const data = await signDocService({
      documentId: req.params.id as string,
      userId: req.user!.id,
      signatureDataUrl: req.body.signatureDataUrl,
      ipAddress,
      userAgent
    });
    res.status(200).json({ success: true, data });
  }
  async getDocuments(req: Request, res: Response) {
    if (req.user!.role !== "ADMIN") {
      throw new AppError(403, "Not authorized");
    }
    const documents = await prisma.document.findMany({
      include: { startup: true },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: documents });
  }
}
