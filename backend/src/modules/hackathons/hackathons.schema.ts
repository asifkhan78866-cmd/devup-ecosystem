import { z } from "zod";

export const hackathonSchema = z.object({
  body: z.object({
    title: z.string(),
    description: z.string(),
    organizer: z.string(),
    startupId: z.string().optional(),
    prizePool: z.string(),
    mode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
    location: z.string().optional(),
    domain: z.array(z.string()),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    registrationDeadline: z.string().datetime(),
    registrationLink: z.string().url().optional(),
    maxParticipants: z.number().int().optional(),
    isEcosystemHosted: z.boolean().default(false),
  })
});

export const updateHackathonSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    organizer: z.string().optional(),
    prizePool: z.string().optional(),
    mode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]).optional(),
    location: z.string().optional(),
    domain: z.array(z.string()).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    registrationDeadline: z.string().datetime().optional(),
    registrationLink: z.string().url().optional(),
    maxParticipants: z.number().int().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
});

export const registerHackathonSchema = z.object({
  body: z.object({
    teamName: z.string().optional(),
    teamSize: z.number().int().min(1).default(1),
  })
});
