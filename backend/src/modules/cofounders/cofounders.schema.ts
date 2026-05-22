import { z } from "zod";

export const cofounderProfileSchema = z.object({
  body: z.object({
    role: z.enum(["DEVELOPER", "DESIGNER", "MARKETER", "OPERATOR", "SALES", "OTHER"]),
    stage: z.enum(["IDEA", "MVP", "LAUNCHED"]),
    seeking: z.array(z.string()),
    availability: z.enum(["FULL_TIME", "PART_TIME", "WEEKENDS"]),
    idea: z.string().optional(),
    isActive: z.boolean().default(true),
  })
});

export const updateCofounderProfileSchema = z.object({
  body: z.object({
    role: z.enum(["DEVELOPER", "DESIGNER", "MARKETER", "OPERATOR", "SALES", "OTHER"]).optional(),
    stage: z.enum(["IDEA", "MVP", "LAUNCHED"]).optional(),
    seeking: z.array(z.string()).optional(),
    availability: z.enum(["FULL_TIME", "PART_TIME", "WEEKENDS"]).optional(),
    idea: z.string().optional(),
    isActive: z.boolean().optional(),
  })
});

export const cofounderRequestSchema = z.object({
  body: z.object({
    message: z.string().min(10).max(500),
  })
});

export const updateRequestSchema = z.object({
  body: z.object({
    status: z.enum(["ACCEPTED", "REJECTED"]),
  })
});
