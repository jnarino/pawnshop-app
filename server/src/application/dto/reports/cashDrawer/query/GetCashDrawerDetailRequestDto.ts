import { z } from 'zod';

export const getCashDrawerDetailRequestSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type GetCashDrawerDetailRequestDto = z.infer<typeof getCashDrawerDetailRequestSchema>;
