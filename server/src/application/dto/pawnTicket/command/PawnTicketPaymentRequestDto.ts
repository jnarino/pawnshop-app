import { z } from 'zod';


export const pawnTicketPaymentRequestSchema = z.object({
  pawnTicketId: z.string().uuid(),
  controlNumber: z.string(),
  paymentAmount: z.number().positive(),
  tender: z.object({
    tenderTypeId: z.number(), // 1: Cash, 3: Debit
    amount: z.number().positive()
  }),
  clerkUserId: z.string().uuid()
});

export type PawnTicketPaymentRequestDto = z.infer<typeof pawnTicketPaymentRequestSchema>;

export const pawnTicketPaymentBatchRequestSchema = z.array(pawnTicketPaymentRequestSchema);
export type PawnTicketPaymentBatchRequestDto = z.infer<typeof pawnTicketPaymentBatchRequestSchema>;
