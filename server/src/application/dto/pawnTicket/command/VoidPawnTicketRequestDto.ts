import { z } from 'zod';

export const voidPawnTicketRequestSchema = z.object({
  controlNumber: z.string().min(1),
  customerId: z.string().uuid(),
  clerkUserId: z.string().uuid().optional(),
  reason: z.string().optional(),
  tenders: z.array(z.object({
    tenderTypeId: z.number(),
    amount: z.number()
  })).optional()
});

export type VoidPawnTicketRequestDto = z.infer<typeof voidPawnTicketRequestSchema>;
