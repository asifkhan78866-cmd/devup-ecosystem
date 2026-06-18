import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { sendConnectionRequest, respondToConnection, getConnections } from './connections.service';

const router = Router();

router.post('/request', requireAuth, async (req, res, next) => {
  try {
    const request = await sendConnectionRequest({
      fromUserId: req.user!.id,
      toUserId: req.body.toUserId,
      message: req.body.message,
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
});

router.post('/:requestId/respond', requireAuth, async (req, res, next) => {
  try {
    const updated = await respondToConnection({
      requestId: req.params.requestId,
      userId: req.user!.id,
      status: req.body.status,
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const connections = await getConnections(req.user!.id);
    res.json({ success: true, data: connections });
  } catch (err) { next(err); }
});

export default router;
