import { z } from "zod";

export const uploadDocumentSchema = z.object({
  body: z.object({
    startupId: z.string(),
    type: z.enum(["NDA", "EQUITY_AGREEMENT", "PARTNERSHIP_TERMS", "OTHER"]),
    name: z.string(),
  })
});
