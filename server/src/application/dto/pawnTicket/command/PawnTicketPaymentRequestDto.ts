import { z } from 'zod';

export const pawnTicketPaymentItemSchema = z.object({
  pawnTicketId: z.string().uuid(),
  controlNumber: z.string(),
  createdDate: z.string().datetime(),
  amountPaid: z.number().positive(),
});

export const pawnTicketTenderSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.union([z.string(), z.number()]),
  tenderTypeId: z.number(),
});

export const pawnTicketPaymentRequestSchema = z.object({
  items: z.array(pawnTicketPaymentItemSchema),
  tenders: z.array(pawnTicketTenderSchema),
  clerkUserId: z.string().uuid()
});

export type PawnTicketPaymentItemDto = z.infer<typeof pawnTicketPaymentItemSchema>;
export type PawnTicketTenderDto = z.infer<typeof pawnTicketTenderSchema>;
export type PawnTicketPaymentRequestDto = z.infer<typeof pawnTicketPaymentRequestSchema>;
