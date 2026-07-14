import { z } from "zod";

// Rich detail-page content blocks. Kept loose (passthrough objects) so admins can
// extend them later without a schema change; all optional and nullable.
const domainsDetailedSchema = z.array(
  z.object({ label: z.string(), sub: z.string().optional(), color: z.string().optional() })
);
const timelineSchema = z.array(
  z.object({
    date: z.string().optional(),
    label: z.string(),
    subtitle: z.string().optional(),
    slots: z.array(
      z.object({
        time: z.string(),
        title: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
      })
    ),
  })
);
const perksSchema = z.array(
  z.object({ icon: z.string().optional(), title: z.string(), desc: z.string().optional() })
);
const logisticsSchema = z.array(
  z.object({ icon: z.string().optional(), label: z.string(), desc: z.string().optional() })
);

export const hackathonSchema = z.object({
  body: z.object({
    title: z.string(),
    description: z.string(),
    organizer: z.string(),
    subtitle: z.string().optional(),
    startupId: z.string().optional(),
    prizePool: z.string(),
    mode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
    location: z.string().optional(),
    domain: z.array(z.string()),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    registrationDeadline: z.string().datetime(),
    registrationLink: z.string().url().optional(),
    registrationFee: z.string().optional(),
    maxParticipants: z.number().int().optional(),
    isEcosystemHosted: z.boolean().default(false),
    domainsDetailed: domainsDetailedSchema.optional(),
    timeline: timelineSchema.optional(),
    perks: perksSchema.optional(),
    logistics: logisticsSchema.optional(),
  })
});

export const updateHackathonSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    organizer: z.string().optional(),
    subtitle: z.string().nullable().optional(),
    prizePool: z.string().optional(),
    mode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]).optional(),
    location: z.string().nullable().optional(),
    domain: z.array(z.string()).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    registrationDeadline: z.string().datetime().optional(),
    registrationLink: z.string().url().nullable().optional(),
    registrationFee: z.string().nullable().optional(),
    maxParticipants: z.number().int().nullable().optional(),
    isEcosystemHosted: z.boolean().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    domainsDetailed: domainsDetailedSchema.nullable().optional(),
    timeline: timelineSchema.nullable().optional(),
    perks: perksSchema.nullable().optional(),
    logistics: logisticsSchema.nullable().optional(),
  })
});

export const registerHackathonSchema = z.object({
  body: z.object({
    teamName: z.string().optional(),
    teamSize: z.number().int().min(1).default(1),
  })
});

export const leadRegistrationSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email").optional(),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian phone number"),
    teamCount: z.number().int().min(1).max(10),
    teamName: z.string().optional(),
    members: z.array(z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string()
    })).optional(),
    college: z.string().min(2, "College must be at least 2 characters"),
  })
});
