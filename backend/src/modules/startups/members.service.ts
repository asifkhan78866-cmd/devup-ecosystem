import { randomBytes } from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { sendTeamInviteEmail } from '../../lib/resend';
import { supabaseAdmin } from '../../config/supabase';
import { createStartupOwnership } from './ownership.service';

const VALID_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;

export async function inviteMember(params: {
  startupId: string;
  invitedBy: string;
  email: string;
  role: string;
}) {
  if (!VALID_ROLES.includes(params.role as any)) {
    throw new AppError(400, 'Invalid role');
  }

  // Only an OWNER of THIS startup can invite
  const inviter = await prisma.startupMember.findFirst({
    where: {
      startupId: params.startupId,
      userId: params.invitedBy,
      status: 'ACTIVE',
      role: 'OWNER',
    },
  });

  if (!inviter) {
    throw new AppError(403, 'Only owners can invite team members');
  }

  const existing = await prisma.startupMember.findUnique({
    where: { startupId_email: { startupId: params.startupId, email: params.email } },
  });

  if (existing) {
    throw new AppError(409, 'This email is already invited or a member');
  }

  const inviteToken = randomBytes(24).toString('hex');

  // Handle re-inviting a removed member by upsert or checking existence
  const member = await prisma.startupMember.upsert({
    where: { startupId_email: { startupId: params.startupId, email: params.email } },
    update: {
      role: params.role as any,
      status: 'INVITED',
      invitedBy: params.invitedBy,
      inviteToken,
      invitedAt: new Date(),
    },
    create: {
      startupId: params.startupId,
      email: params.email,
      role: params.role as any,
      status: 'INVITED',
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
  
  if (!member || member.status !== 'INVITED') {
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
  await assertIsOwner(params.startupId, params.requestedBy);
  if (!VALID_ROLES.includes(params.newRole as any)) {
    throw new AppError(400, 'Invalid role');
  }
  return prisma.startupMember.update({
    where: { id: params.memberId },
    data: { role: params.newRole as any },
  });
}

export async function removeMember(params: {
  startupId: string; memberId: string; requestedBy: string;
}) {
  await assertIsOwner(params.startupId, params.requestedBy);
  const member = await prisma.startupMember.findUnique({
    where: { id: params.memberId }
  });

  if (!member) throw new AppError(404, 'Member not found');

  // Never leave a startup ownerless.
  if (member.role === 'OWNER') {
    const activeOwners = await prisma.startupMember.count({
      where: { startupId: params.startupId, role: 'OWNER', status: 'ACTIVE' },
    });
    if (activeOwners <= 1) {
      throw new AppError(400, 'Cannot remove the last owner');
    }
  }

  return prisma.startupMember.delete({ where: { id: params.memberId } });
}

async function assertIsOwner(startupId: string, userId: string) {
  const member = await prisma.startupMember.findFirst({
    where: {
      startupId,
      userId,
      status: 'ACTIVE',
      role: 'OWNER',
    },
  });

  if (!member) throw new AppError(403, 'Only owners can manage the team');
}

// ---------------------------------------------------------------------------
// Admin-issued founder invites (reuses the StartupMember row as the invite
// record — INVITED == "pending", ACTIVE == "consumed"). No separate Invite
// table; expiry (expiresAt) is not yet modeled and is deferred.
// ---------------------------------------------------------------------------

// ADMIN-only: invite a founder (by email) to OWN an existing startup.
export async function adminInviteFounder(params: {
  startupId: string;
  email: string;
  invitedBy: string;
}) {
  if (!params.email) throw new AppError(400, 'Email is required');

  const startup = await prisma.startup.findUnique({ where: { id: params.startupId } });
  if (!startup) throw new AppError(404, 'Startup not found');

  const existing = await prisma.startupMember.findUnique({
    where: { startupId_email: { startupId: params.startupId, email: params.email } },
  });
  if (existing && existing.status === 'ACTIVE') {
    throw new AppError(409, 'This email is already a member of this startup');
  }

  const inviteToken = randomBytes(24).toString('hex');

  // Upsert so a stale/re-sent invite just re-issues a fresh token.
  const member = await prisma.startupMember.upsert({
    where: { startupId_email: { startupId: params.startupId, email: params.email } },
    update: {
      role: 'OWNER',
      status: 'INVITED',
      invitedBy: params.invitedBy,
      inviteToken,
      invitedAt: new Date(),
    },
    create: {
      startupId: params.startupId,
      email: params.email,
      role: 'OWNER',
      status: 'INVITED',
      invitedBy: params.invitedBy,
      inviteToken,
    },
  });

  await sendTeamInviteEmail({
    to: params.email,
    startupName: startup.name,
    role: 'Founder',
    inviteLink: `${process.env.FRONTEND_URL}/invite/${inviteToken}`,
  });

  return member;
}

// Public: details the accept page needs to render (startup name + which flow).
export async function getInviteByToken(token: string) {
  const member = await prisma.startupMember.findUnique({
    where: { inviteToken: token },
    include: { startup: { select: { name: true, slug: true } } },
  });
  if (!member) throw new AppError(404, 'Invite not found');

  const account = await prisma.user.findUnique({ where: { email: member.email } });

  return {
    email: member.email,
    startupName: member.startup?.name ?? null,
    role: member.role,
    status: member.status,
    consumed: member.status !== 'INVITED',
    hasAccount: Boolean(account),
  };
}

// New-user path: set a password, create the account, then attach ownership.
// Existing accounts use the existing POST /invites/:token/accept (logged in).
export async function registerAndAccept(params: {
  token: string;
  password: string;
  name?: string;
}) {
  if (!params.password || params.password.length < 6) {
    throw new AppError(400, 'Password must be at least 6 characters');
  }

  const member = await prisma.startupMember.findUnique({ where: { inviteToken: params.token } });
  if (!member || member.status !== 'INVITED') {
    throw new AppError(400, 'Invite is invalid or already used');
  }

  const existing = await prisma.user.findUnique({ where: { email: member.email } });
  if (existing) {
    throw new AppError(409, 'An account already exists for this email — please log in and accept the invite', 'ACCOUNT_EXISTS');
  }

  // Create the Supabase auth user + DB user (same mechanism as auth register).
  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email: member.email,
    password: params.password,
    email_confirm: true,
  });
  if (error || !authData.user) {
    throw new AppError(500, error?.message || 'Failed to create account', 'SUPABASE_CREATE_FAILED');
  }

  const user = await prisma.user.create({
    data: {
      id: authData.user.id,
      email: member.email,
      role: Role.FOUNDER,
      profile: { create: { name: params.name || member.email.split('@')[0] } },
    },
  });

  // Attach to the EXISTING startup: upsert promotes the INVITED row to ACTIVE OWNER.
  await createStartupOwnership(prisma, {
    startupId: member.startupId,
    userId: user.id,
    email: member.email,
    invitedBy: member.invitedBy,
  });

  return { email: member.email, startupId: member.startupId };
}
