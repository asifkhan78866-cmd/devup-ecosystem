import { z } from "zod";

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    bio: z.string().optional(),
    college: z.string().optional(),
    city: z.string().optional(),
    linkedinUrl: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    twitterUrl: z.string().url().optional(),
    portfolioUrl: z.string().url().optional(),
    skills: z.array(z.string()).optional(),
    isOpenToWork: z.boolean().optional(),
    isLookingForCofounder: z.boolean().optional(),
  })
});
