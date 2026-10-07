import { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { sendTeamInviteEmail } from '../../lib/resend';
import { supabaseAdmin } from '../../config/supabase';
import { newToken, hashToken } from '../../lib/tokens';
import { claimByEmail } from '../shared/claim.service';

/**
 * Every tenant role is storable, so team structure can be recorded now and the
 * permissions split out later without a migration. The workspace currently
 * gives anyone at ADMIN or above the full management surface.
 */
const VALID_ROLES = [
  'FOUNDER', 'OWNER', 'ADMIN', 'HR', 'RECRUITER', 'MANAGER', 'EMPLOYEE', 'INTERN', 'MEMBER',
] as const;

/**
 * FOUNDER and OWNER are the same authority. Both exist because existing rows
 * were migrated from OWNER to FOUNDER — checking only one would lock the other
 * out of managing their own team.
 */
const OWNER_ROLES = ['OWNER', 'FOUNDER'] as const;

/**
 * Invitations are bearer links: whoever holds one can join a startup.
 *
 *   - The token is 256 random bits and only its SHA-256 is stored in
 *     `inviteToken`, so the database cannot be turned back into working links.
 *   - It expires INVITE_TTL_DAYS after it was (re)issued.
 *   - Using it rotates the stored hash, so the link dies on first use and a
 *     replay finds nothing.
 *   - Acceptance is bound to the invited address.
 *
 * Every failure gives the same answer, which says nothing about whether the
 * invite or the person exists.
 */
export const INVITE_TTL_DAYS = 7;

const invalidInvite = () => new AppError(404, 'This invite is invalid or has expired', 'INVITE_INVALID');

const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

async function findUsableInvite(token: string) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 200) throw invalidInvite();
  const member = await prisma.startupMember.findUnique({
    where: { inviteToken: hashToken(token) },
    include: { startup: { select: { name: true, slug: true } } },
  });
  if (!member || member.status !== 'INVITED') throw invalidInvite();
  if (Date.now() - member.invitedAt.getTime() > INVITE_TTL_DAYS * 24 * 60 * 60_000) throw invalidInvite();
  return member;
}

/**
 * Spends the invite. Conditional on it still being INVITED with the same hash,
 * so of two simultaneous acceptances exactly one wins; the hash is replaced
 * with one nobody holds.
 */
async function consumeInvite(member: { id: string; inviteToken: string }, userId: string) {
  const { count } = await prisma.startupMember.updateMany({
    where: { id: member.id, status: 'INVITED', inviteToken: member.inviteToken },
    data: { userId, status: 'ACTIVE', joinedAt: new Date(), inviteToken: newToken().hash },
  });
  if (count !== 1) throw invalidInvite();
}

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
      role: { in: OWNER_ROLES as unknown as string[] } as never,
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

  const { token: inviteToken, hash: inviteTokenHash } = newToken();

  // Handle re-inviting a removed member by upsert or checking existence
  const member = await prisma.startupMember.upsert({
    where: { startupId_email: { startupId: params.startupId, email: params.email } },
    update: {
      role: params.role as any,
      status: 'INVITED',
      invitedBy: params.invitedBy,
      inviteToken: inviteTokenHash,
      invitedAt: new Date(),
    },
    create: {
      startupId: params.startupId,
      email: params.email,
      role: params.role as any,
      status: 'INVITED',
      invitedBy: params.invitedBy,
      inviteToken: inviteTokenHash,
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

/**
 * Existing account, signed in. The invite is bound to its address, and the
 * account must have proven it owns that address — otherwise anyone who signed
 * up with the invitee's email and got hold of the link could take the seat.
 */
export async function acceptInvite(token: string, userId: string) {
  const member = await findUsableInvite(token);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerifiedAt: true },
  });
  if (!user || !sameEmail(user.email, member.email)) {
    throw new AppError(403, 'This invite was sent to a different email address', 'INVITE_EMAIL_MISMATCH');
  }
  if (!user.emailVerifiedAt) {
    throw new AppError(403, 'Verify your email address before accepting this invite', 'EMAIL_NOT_VERIFIED');
  }

  await consumeInvite(member, userId);
  await claimByEmail(userId);
  return prisma.startupMember.findUnique({ where: { id: member.id } });
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
  if ((OWNER_ROLES as readonly string[]).includes(member.role)) {
    const activeOwners = await prisma.startupMember.count({
      where: {
        startupId: params.startupId,
        role: { in: OWNER_ROLES as unknown as string[] } as never,
        status: 'ACTIVE',
      },
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
      role: { in: OWNER_ROLES as unknown as string[] } as never,
    },
  });

  if (!member) throw new AppError(403, 'Only owners can manage the team');
}

// ---------------------------------------------------------------------------
// Admin-issued founder invites (reuses the StartupMember row as the invite
// record — INVITED == "pending", ACTIVE == "consumed"). No separate Invite
// table; expiry runs from invitedAt (see INVITE_TTL_DAYS).
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

  const { token: inviteToken, hash: inviteTokenHash } = newToken();

  // Upsert so a stale/re-sent invite just re-issues a fresh token.
  const member = await prisma.startupMember.upsert({
    where: { startupId_email: { startupId: params.startupId, email: params.email } },
    update: {
      role: 'FOUNDER',
      status: 'INVITED',
      invitedBy: params.invitedBy,
      inviteToken: inviteTokenHash,
      invitedAt: new Date(),
    },
    create: {
      startupId: params.startupId,
      email: params.email,
      role: 'FOUNDER',
      status: 'INVITED',
      invitedBy: params.invitedBy,
      inviteToken: inviteTokenHash,
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
// Only a live invite answers; used, expired and unknown links look the same.
export async function getInviteByToken(token: string) {
  const member = await findUsableInvite(token);

  const account = await prisma.user.findFirst({
    where: { email: { equals: member.email, mode: 'insensitive' } },
    select: { id: true },
  });

  return {
    email: member.email,
    startupName: member.startup?.name ?? null,
    role: member.role,
    status: member.status,
    consumed: false,
    hasAccount: Boolean(account),
    expiresAt: new Date(member.invitedAt.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60_000),
  };
}

/**
 * New-user path: set a password, create the account, join with the invited role.
 * Existing accounts use POST /invites/:token/accept (signed in).
 *
 * The invite link reached this person through the invited inbox, so holding it
 * is proof of the address: the account is created confirmed and verified, and
 * anything else HR created for the address is attached. That is the only
 * reason it may skip email verification.
 */
export async function registerAndAccept(params: {
  token: string;
  password: string;
  name?: string;
}) {
  if (!params.password || params.password.length < 6) {
    throw new AppError(400, 'Password must be at least 6 characters');
  }

  const member = await findUsableInvite(params.token);

  const existing = await prisma.user.findFirst({
    where: { email: { equals: member.email, mode: 'insensitive' } },
    select: { id: true },
  });
  if (existing) {
    throw new AppError(409, 'An account already exists for this email — please log in and accept the invite', 'ACCOUNT_EXISTS');
  }

  const email = member.email.trim().toLowerCase();
  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: params.password,
    email_confirm: true,
  });
  if (error || !authData.user) {
    if (error?.code === 'email_exists') {
      throw new AppError(409, 'An account already exists for this email — please log in and accept the invite', 'ACCOUNT_EXISTS');
    }
    throw new AppError(500, 'Failed to create account', 'SUPABASE_CREATE_FAILED');
  }

  // The platform role follows the invited role. Previously every invitee who
  // took this path became a FOUNDER and the startup's owner, whatever they
  // were invited as.
  const isOwnerInvite = (OWNER_ROLES as readonly string[]).includes(member.role);
  const user = await prisma.user.create({
    data: {
      id: authData.user.id,
      email,
      role: isOwnerInvite ? Role.FOUNDER : Role.STUDENT,
      emailVerifiedAt: new Date(),
      profile: { create: { name: params.name || email.split('@')[0] } },
    },
  });

  await consumeInvite(member, user.id);
  await claimByEmail(user.id);

  return { email: member.email, startupId: member.startupId };
}
