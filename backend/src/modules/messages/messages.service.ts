import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";

export async function getMessages(userId: string, contactId: string) {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId }
      ]
    },
    orderBy: { createdAt: "asc" }
  });
  
  // Mark messages as read if the current user is the receiver
  await prisma.message.updateMany({
    where: {
      senderId: contactId,
      receiverId: userId,
      read: false
    },
    data: {
      read: true
    }
  });

  return messages;
}

export async function sendMessage(senderId: string, receiverId: string, content: string) {
  if (!content?.trim()) {
    throw new AppError(400, "Message content cannot be empty");
  }

  // Optional: Verify that they are connected, but we can assume the frontend/controller enforces this
  // or they just have an open network.

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      content: content.trim()
    }
  });

  return message;
}
