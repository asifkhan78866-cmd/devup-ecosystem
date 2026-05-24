import { z } from "zod";

export const createServiceRequestSchema = z.object({
  body: z.object({
    serviceId: z.string(),
    serviceName: z.string(),
    name: z.string(),
    company: z.string(),
    email: z.string().email(),
    details: z.string(),
  }),
});

export const updateServiceRequestStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(["PENDING", "REVIEWING", "CONTACTED", "REJECTED", "FULFILLED"]),
  }),
});
