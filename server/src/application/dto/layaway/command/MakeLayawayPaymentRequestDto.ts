import { z } from 'zod';

export const makeLayawayPaymentRequestSchema = z.object({
  customerId: z.string().uuid(),
  ticketnum: z.string().min(1),
  amount: z.number().positive(),
  tenderTypeId: z.number().int().positive().default(1), // Default to Cash (1)
  note: z.string().optional(),
});

export type MakeLayawayPaymentRequestDto = z.infer<typeof makeLayawayPaymentRequestSchema>;
