import { z } from "zod";

export const aiReviewSchema = z.object({
  body: z.object({
    applicationId: z.string(),
  })
});

export const aiMatchSchema = z.object({
  body: z.object({
    profileId: z.string(),
  })
});

export const aiGenerateBioSchema = z.object({
  body: z.object({
    startupDetails: z.string(),
  })
});
