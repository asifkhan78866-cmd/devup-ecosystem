import { Router } from 'express';
import { researchStartup } from './webResearch.service';
import { aiLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth';
import { researchStartupSchema } from './ai.schema';

const router = Router();

router.post(
  '/research-startup',
  requireAuth,
  requireRole(['ADMIN', 'FOUNDER']),
  aiLimiter,
  validate(researchStartupSchema),
  async (req, res, next) => {
    try {
      const result = await researchStartup({
        startupId: req.body.startupId,
        applicationId: req.body.applicationId,
        startupName: req.body.startupName,
        websiteUrl: req.body.websiteUrl,
        triggeredBy: req.user!.id,
        forceRefresh: req.body.forceRefresh,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
