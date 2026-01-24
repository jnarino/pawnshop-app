import { z } from 'zod';

export const getLayawayHistoryRequestSchema = z.object({
  customerId: z.string().uuid(),
  ticketnum: z.string().min(1)
});

export type GetLayawayHistoryRequestDto = z.infer<typeof getLayawayHistoryRequestSchema>;
