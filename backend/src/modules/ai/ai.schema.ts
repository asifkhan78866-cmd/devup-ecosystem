import { z } from 'zod';

export const researchStartupSchema = z.object({
  body: z.object({
    startupId: z.string().uuid().optional(),
    applicationId: z.string().uuid().optional(),
    startupName: z.string().min(2),
    websiteUrl: z.string().url(),
    forceRefresh: z.boolean().optional(),
  })
});
