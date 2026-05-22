import { z } from "zod";

export const applicationSchema = z.object({
  body: z.object({
    startupName: z.string(),
    domain: z.enum(["AI_ML", "FINTECH", "HEALTHTECH", "DEVTOOLS", "SAAS", "EDTECH", "WEB3", "OTHER"]),
    oneLiner: z.string(),
    website: z.string().url().optional(),
    stage: z.enum(["IDEA", "PRE_SEED", "SEED", "SERIES_A", "SERIES_B"]),
    mrr: z.string().optional(),
    userCount: z.string().optional(),
    teamMembers: z.any(), // Assuming JSON array
    needs: z.array(z.string()),
  })
});

export const reviewApplicationSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED", "REVIEWING"]),
    reviewNotes: z.string().optional(),
  })
});
