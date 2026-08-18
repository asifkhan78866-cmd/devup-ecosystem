import { LeadershipAppStatus, LeadershipRole } from "@prisma/client";
import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const submitLeadApplicationSchema = z.object({
  body: z.object({
    role: z.nativeEnum(LeadershipRole),
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
    phone: z.string().trim().min(7).max(30),
    state: z.string().trim().min(2).max(100),
    city: z.string().trim().min(2).max(100),
    college: z.string().trim().min(2).max(200),
    branch: optionalText(120),
    yearOfStudy: optionalText(50),
    linkedinUrl: optionalText(500),
    githubUrl: optionalText(500),
    twitterUrl: optionalText(500),
    portfolioUrl: optionalText(500),
    whyLead: z.string().trim().min(1).max(5000),
    pastExperience: optionalText(5000),
    first30DaysPlan: optionalText(5000),
  }),
});

export const updateLeadApplicationStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(LeadershipAppStatus),
    reviewNotes: optionalText(5000),
  }),
});
