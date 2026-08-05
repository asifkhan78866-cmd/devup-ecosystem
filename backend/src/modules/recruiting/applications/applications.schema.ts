import { z } from "zod";

const PIPELINE_STAGES = [
  "APPLIED",
  "RESUME_SCREENING",
  "SHORTLISTED",
  "HR_ROUND",
  "TECHNICAL_ROUND",
  "ASSIGNMENT",
  "FINAL_INTERVIEW",
  "SELECTED",
  "OFFER_GENERATED",
  "OFFER_ACCEPTED",
  "ONBOARDING",
  "ONBOARDED",
] as const;

const optionalUrl = z.string().url().optional().or(z.literal(""));

// multipart/form-data delivers everything as strings, so arrays and numbers
// arrive encoded and must be coerced before validation.
const csvArray = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => {
    if (v == null) return undefined;
    if (Array.isArray(v)) return v;
    const trimmed = v.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed) as string[];
      } catch {
        /* fall through to CSV */
      }
    }
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  });

export const applySchema = z.object({
  body: z.object({
    coverLetter: z.string().max(5000).optional(),
    portfolioUrl: optionalUrl,
    githubUrl: optionalUrl,
    linkedinUrl: optionalUrl,
    skills: csvArray,
    college: z.string().max(200).optional(),
    cgpa: z.coerce.number().min(0).max(10).optional(),
    experienceYears: z.coerce.number().min(0).max(60).optional(),
    applicantName: z.string().max(120).optional(),
    applicantEmail: z.string().email().optional(),
    applicantPhone: z.string().max(20).optional(),
  }),
});

export const transitionSchema = z.object({
  body: z.object({
    toStage: z.enum(PIPELINE_STAGES),
    version: z.coerce.number().int().min(0),
    note: z.string().max(1000).optional(),
  }),
});

export const rejectSchema = z.object({
  body: z.object({
    reason: z.string().min(3).max(1000),
    version: z.coerce.number().int().min(0),
  }),
});

export const bulkTransitionSchema = z.object({
  body: z.object({
    applicationIds: z.array(z.string().uuid()).min(1).max(500),
    toStage: z.enum(PIPELINE_STAGES).optional(),
    reject: z.boolean().optional(),
    reason: z.string().max(1000).optional(),
  }),
});
