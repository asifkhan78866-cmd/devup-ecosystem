import { Request, Response } from "express";
import * as messagesService from "./messages.service";
import { AppError } from "../../middleware/errorHandler";

export async function getMessages(req: Request, res: Response) {
  const userId = req.user?.id;
  const contactId = req.params.contactId;

  if (!userId) throw new AppError(401, "Unauthorized");
  if (!contactId) throw new AppError(400, "Contact ID is required");

  const messages = await messagesService.getMessages(userId, contactId);
  res.json({ success: true, data: messages });
}

export async function sendMessage(req: Request, res: Response) {
  const userId = req.user?.id;
  const contactId = req.params.contactId;
  const { content } = req.body;

  if (!userId) throw new AppError(401, "Unauthorized");
  if (!contactId) throw new AppError(400, "Contact ID is required");
  if (!content) throw new AppError(400, "Message content is required");

  const message = await messagesService.sendMessage(userId, contactId, content);
  res.json({ success: true, data: message });
}
