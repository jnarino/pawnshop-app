import { z } from 'zod';

export const getPoliceReportsRequestSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  agency: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(500).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

export type GetPoliceReportsRequestDto = z.infer<typeof getPoliceReportsRequestSchema>;

export const getActivePoliceHoldsRequestSchema = z.object({
  limit: z.number().int().min(1).max(500).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

export type GetActivePoliceHoldsRequestDto = z.infer<typeof getActivePoliceHoldsRequestSchema>;
