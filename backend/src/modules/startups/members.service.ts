import { randomBytes } from 'crypto';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { sendTeamInviteEmail } from '../../lib/resend';

const VALID_ROLES = [
  'Founder', 'Co-Founder', 'CTO', 'Developer', 
  'Designer', 'Marketing', 'Operator', 'Intern',
];

export async function inviteMember(params: {
  startupId: string;
  invitedBy: string;
  email: string;
  role: string;
}) {
  if (!VALID_ROLES.includes(params.role)) {
    throw new AppError(400, 'Invalid role');
  }

  // Only the founder/co-founder of THIS startup can invite
  const inviter = await prisma.startupMember.findFirst({
    where: { 
      startupId: params.startupId, 
      userId: params.invitedBy, 
      status: 'ACTIVE',
      role: { in: ['Founder', 'Co-Founder'] },
    },
  });
  
  if (!inviter) {
    throw new AppError(403, 'Only founders can invite team members');
  }

  const existing = await prisma.startupMember.findUnique({
    where: { startupId_email: { startupId: params.startupId, email: params.email } },
  });
  
  if (existing && existing.status !== 'REMOVED') {
    throw new AppError(409, 'This email is already invited or a member');
  }

  const inviteToken = randomBytes(24).toString('hex');

  // Handle re-inviting a removed member by upsert or checking existence
  const member = await prisma.startupMember.upsert({
    where: { startupId_email: { startupId: params.startupId, email: params.email } },
    update: {
      role: params.role,
      status: 'PENDING',
      invitedBy: params.invitedBy,
      inviteToken,
      invitedAt: new Date(),
    },
    create: {
      startupId: params.startupId,
      email: params.email,
      role: params.role,
      status: 'PENDING',
      invitedBy: params.invitedBy,
      inviteToken,
    },
  });

  const startup = await prisma.startup.findUnique({ 
    where: { id: params.startupId } 
  });

  await sendTeamInviteEmail({
    to: params.email,
    startupName: startup!.name,
    role: params.role,
    inviteLink: `${process.env.FRONTEND_URL}/invite/${inviteToken}`,
  });

  return member;
}

export async function acceptInvite(token: string, userId: string) {
  const member = await prisma.startupMember.findUnique({
    where: { inviteToken: token },
  });
  
  if (!member || member.status !== 'PENDING') {
    throw new AppError(400, 'Invite is invalid or already used');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.email !== member.email) {
    throw new AppError(403, 'This invite was sent to a different email address');
  }

  return prisma.startupMember.update({
    where: { id: member.id },
    data: { userId, status: 'ACTIVE', joinedAt: new Date() },
  });
}

export async function changeRole(params: {
  startupId: string; memberId: string; 
  newRole: string; requestedBy: string;
}) {
  await assertIsFounder(params.startupId, params.requestedBy);
  if (!VALID_ROLES.includes(params.newRole)) {
    throw new AppError(400, 'Invalid role');
  }
  return prisma.startupMember.update({
    where: { id: params.memberId },
    data: { role: params.newRole },
  });
}

export async function removeMember(params: {
  startupId: string; memberId: string; requestedBy: string;
}) {
  await assertIsFounder(params.startupId, params.requestedBy);
  const member = await prisma.startupMember.findUnique({ 
    where: { id: params.memberId } 
  });
  
  if (member?.role === 'Founder') {
    throw new AppError(400, 'Cannot remove the primary founder');
  }
  
  return prisma.startupMember.update({
    where: { id: params.memberId },
    data: { status: 'REMOVED', removedAt: new Date() },
  });
}

async function assertIsFounder(startupId: string, userId: string) {
  const member = await prisma.startupMember.findFirst({
    where: { 
      startupId, 
      userId, 
      status: 'ACTIVE', 
      role: { in: ['Founder', 'Co-Founder'] } 
    },
  });
  
  if (!member) throw new AppError(403, 'Only founders can manage the team');
}
