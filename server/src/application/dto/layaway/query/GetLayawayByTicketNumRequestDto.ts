import { z } from 'zod';

export const getLayawayByTicketNumRequestSchema = z.object({
  ticketnum: z.string().min(1)
});

export type GetLayawayByTicketNumRequestDto = z.infer<typeof getLayawayByTicketNumRequestSchema>;
