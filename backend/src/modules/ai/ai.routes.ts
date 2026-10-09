import { Router } from 'express';
import { researchStartup } from './webResearch.service';

import { validate } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth';
import { researchStartupSchema } from './ai.schema';
import { aiResearchUserLimiter, aiResearchIpLimiter, aiResearchGlobalLimiter } from '../../middleware/rateLimit';

const router = Router();

router.post(
  '/research-startup',
  requireAuth,
  requireRole(['ADMIN', 'FOUNDER']),
  // After authentication so the account is known; per account, then per IP, then the global ceiling.
  aiResearchUserLimiter,
  aiResearchIpLimiter,
  aiResearchGlobalLimiter,
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
