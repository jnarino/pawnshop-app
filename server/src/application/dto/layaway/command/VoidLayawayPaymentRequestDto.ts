import { z } from 'zod';

export const voidLayawayPaymentRequestSchema = z.object({
  customerId: z.string().uuid(),
  ticketnum: z.string().min(1),
  amount: z.number().positive(),
  note: z.string().optional(),
});

export type VoidLayawayPaymentRequestDto = z.infer<typeof voidLayawayPaymentRequestSchema>;
