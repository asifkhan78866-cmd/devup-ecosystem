import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

export async function sendConnectionRequest(params: {
  fromUserId: string;
  toUserId: string;
  message: string;
}) {
  if (params.fromUserId === params.toUserId) {
    throw new AppError(400, "You cannot connect with yourself");
  }

  // Check role authorization
  const fromUser = await prisma.user.findUnique({
    where: { id: params.fromUserId },
    select: { role: true, profile: true },
  });

  const allowedRoles = ['FOUNDER', 'MENTOR', 'INVESTOR'];
  if (!allowedRoles.includes(fromUser?.role || '')) {
    throw new AppError(403, "Only verified roles can send connection requests");
  }

  const existing = await prisma.connectionRequest.findFirst({
    where: {
      OR: [
        { fromUserId: params.fromUserId, toUserId: params.toUserId },
        { fromUserId: params.toUserId, toUserId: params.fromUserId },
      ],
    },
  });

  if (existing) {
    if (existing.status === 'ACCEPTED') throw new AppError(400, "You are already connected");
    if (existing.status === 'PENDING') throw new AppError(400, "A request is already pending");
  }

  const request = await prisma.connectionRequest.create({
    data: {
      fromUserId: params.fromUserId,
      toUserId: params.toUserId,
      message: params.message,
      status: 'PENDING',
    },
  });

  await prisma.notification.create({
    data: {
      userId: params.toUserId,
      title: 'New Connection Request',
      message: `${fromUser?.profile?.name || 'Someone'} wants to connect.`,
      type: 'CONNECTION_REQUEST',
      link: '/dashboard/connections',
    },
  });

  return request;
}

export async function respondToConnection(params: {
  requestId: string;
  userId: string;
  status: 'ACCEPTED' | 'REJECTED';
}) {
  const request = await prisma.connectionRequest.findUnique({
    where: { id: params.requestId },
  });

  if (!request) throw new AppError(404, "Request not found");
  if (request.toUserId !== params.userId) throw new AppError(403, "Not authorized");

  const updated = await prisma.connectionRequest.update({
    where: { id: params.requestId },
    data: { status: params.status, respondedAt: new Date() },
  });

  if (params.status === 'ACCEPTED') {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { profile: true },
    });

    await prisma.notification.create({
      data: {
        userId: request.fromUserId,
        title: 'Connection Accepted',
        message: `${user?.profile?.name || 'Someone'} accepted your connection request.`,
        type: 'CONNECTION_ACCEPTED',
        link: '/dashboard/connections',
      },
    });
  }

  return updated;
}

export async function getConnections(userId: string) {
  const pendingRequests = await prisma.connectionRequest.findMany({
    where: { toUserId: userId, status: 'PENDING' },
    include: { fromUser: { include: { profile: true } } },
  });

  const acceptedConnections = await prisma.connectionRequest.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [
        { fromUserId: userId },
        { toUserId: userId },
      ],
    },
    include: {
      fromUser: { include: { profile: true } },
      toUser: { include: { profile: true } },
    },
  });

  return { pendingRequests, acceptedConnections };
}
