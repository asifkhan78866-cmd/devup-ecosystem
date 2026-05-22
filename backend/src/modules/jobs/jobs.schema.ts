import { z } from "zod";

export const jobSchema = z.object({
  body: z.object({
    startupId: z.string(),
    title: z.string(),
    description: z.string(),
    type: z.enum(["INTERNSHIP", "FULL_TIME", "PART_TIME", "CONTRACT"]),
    domain: z.string(),
    skills: z.array(z.string()),
    location: z.string(),
    isRemote: z.boolean().default(false),
    stipend: z.string().optional(),
    salaryRange: z.string().optional(),
    openings: z.number().int().default(1),
    deadline: z.string().datetime().optional(),
  })
});

export const updateJobSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(["INTERNSHIP", "FULL_TIME", "PART_TIME", "CONTRACT"]).optional(),
    domain: z.string().optional(),
    skills: z.array(z.string()).optional(),
    location: z.string().optional(),
    isRemote: z.boolean().optional(),
    stipend: z.string().optional(),
    salaryRange: z.string().optional(),
    openings: z.number().int().optional(),
    deadline: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
  })
});

export const applyJobSchema = z.object({
  body: z.object({
    coverLetter: z.string().optional(),
  })
});
