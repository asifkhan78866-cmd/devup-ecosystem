import { z } from "zod";

export const startupSchema = z.object({
  body: z.object({
    name: z.string(),
    slug: z.string(),
    tagline: z.string(),
    description: z.string(),
    domain: z.enum(["AI_ML", "FINTECH", "HEALTHTECH", "DEVTOOLS", "SAAS", "EDTECH", "WEB3", "E_COMMERCE", "CLEANTECH", "DEEPTECH", "OTHER"]),
    stage: z.enum(["IDEA", "MVP", "PRE_SEED", "SEED", "SERIES_A", "SERIES_B", "GROWTH"]),
    foundedYear: z.coerce.number().int(),
    headcount: z.string(),
    location: z.string(),
    city: z.string().optional(),
    founderId: z.string().optional(),
    githubUrl: z.string().url().optional().or(z.literal("")),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
    twitterUrl: z.string().url().optional().or(z.literal("")),
    website: z.string().url().optional().or(z.literal("")),
  })
});

export const updateStartupSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    tagline: z.string().optional(),
    description: z.string().optional(),
    domain: z.enum(["AI_ML", "FINTECH", "HEALTHTECH", "DEVTOOLS", "SAAS", "EDTECH", "WEB3", "E_COMMERCE", "CLEANTECH", "DEEPTECH", "OTHER"]).optional(),
    stage: z.enum(["IDEA", "MVP", "PRE_SEED", "SEED", "SERIES_A", "SERIES_B", "GROWTH"]).optional(),
    headcount: z.string().optional(),
    location: z.string().optional(),
    city: z.string().optional(),
    fundingAmount: z.string().optional(),
    mrr: z.string().optional(),
    userCount: z.string().optional(),
    githubUrl: z.string().url().optional().or(z.literal("")),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
    twitterUrl: z.string().url().optional().or(z.literal("")),
    website: z.string().url().optional().or(z.literal("")),
  })
});
