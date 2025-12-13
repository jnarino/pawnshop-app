import { z } from 'zod';

export const getPawnTicketPaymentsRequestSchema = z.object({
  pawnTicketId: z.string().uuid()
});

export type GetPawnTicketPaymentsRequestDto = z.infer<typeof getPawnTicketPaymentsRequestSchema>;
