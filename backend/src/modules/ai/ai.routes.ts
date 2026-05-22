import { Router } from "express";
import { AiController } from "./ai.controller";
import { validate } from "../../middleware/validate";
import { aiReviewSchema, aiMatchSchema, aiGenerateBioSchema } from "./ai.schema";
import { requireAuth, requireRole } from "../../middleware/auth";
import { aiLimiter } from "../../middleware/rateLimit";

const router = Router();
const controller = new AiController();

router.use(aiLimiter); // Apply strict AI rate limits

router.post("/review-application", requireAuth, requireRole(["ADMIN"]), validate(aiReviewSchema), controller.reviewApplication);
router.post("/match-cofounders", requireAuth, validate(aiMatchSchema), controller.matchCofounders);
router.post("/generate-bio", requireAuth, validate(aiGenerateBioSchema), controller.generateBio);

export default router;
