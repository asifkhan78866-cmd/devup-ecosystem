import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  inviteMember, acceptInvite, changeRole, removeMember,
  adminInviteFounder, getInviteByToken, registerAndAccept,
} from './members.service';
import { prisma } from '../../lib/prisma';

const router = Router();

// ADMIN-only: invite a founder (by email) to own an existing startup.
router.post('/:startupId/invite', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const invite = await adminInviteFounder({
      startupId: req.params.startupId,
      email: req.body.email,
      invitedBy: req.user!.id,
    });
    res.status(201).json({ success: true, data: invite });
  } catch (err) { next(err); }
});

// Public: invite details for the accept page (startup name + which flow to show).
router.get('/invites/:token', async (req, res, next) => {
  try {
    const invite = await getInviteByToken(req.params.token);
    res.json({ success: true, data: invite });
  } catch (err) { next(err); }
});

// Public: new-user accept — set password, create account, attach ownership.
router.post('/invites/:token/register', async (req, res, next) => {
  try {
    const result = await registerAndAccept({
      token: req.params.token,
      password: req.body.password,
      name: req.body.name,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/:startupId/members/invite', requireAuth, async (req, res, next) => {
  try {
    const member = await inviteMember({
      startupId: req.params.startupId,
      invitedBy: req.user!.id,
      email: req.body.email,
      role: req.body.role,
    });
    res.status(201).json({ success: true, data: member });
  } catch (err) { next(err); }
});

router.post('/invites/:token/accept', requireAuth, async (req, res, next) => {
  try {
    const member = await acceptInvite(req.params.token, req.user!.id);
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
});

router.get('/:startupId/members', requireAuth, async (req, res, next) => {
  try {
    const members = await prisma.startupMember.findMany({
      where: { startupId: req.params.startupId },
      include: { user: { select: { id: true, email: true, avatarUrl: true, profile: true } } },
    });
    res.json({ success: true, data: members });
  } catch (err) { next(err); }
});

router.patch('/:startupId/members/:memberId/role', requireAuth, async (req, res, next) => {
  try {
    const member = await changeRole({
      startupId: req.params.startupId,
      memberId: req.params.memberId,
      newRole: req.body.role,
      requestedBy: req.user!.id,
    });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
});

router.delete('/:startupId/members/:memberId', requireAuth, async (req, res, next) => {
  try {
    const member = await removeMember({
      startupId: req.params.startupId,
      memberId: req.params.memberId,
      requestedBy: req.user!.id,
    });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
});

export default router;
