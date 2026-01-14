import { z } from 'zod';

export const getCustomerStatisticsRequestSchema = z.object({
  id: z.string().uuid()
});

export type GetCustomerStatisticsRequestDto = z.infer<typeof getCustomerStatisticsRequestSchema>;
