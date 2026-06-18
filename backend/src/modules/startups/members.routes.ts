import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { inviteMember, acceptInvite, changeRole, removeMember } from './members.service';
import { prisma } from '../../lib/prisma';

const router = Router();

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
      where: { startupId: req.params.startupId, status: { not: 'REMOVED' } },
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
