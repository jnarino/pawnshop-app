import { z } from 'zod';
import { createStoreTransactionTenderSchema } from '../../storeTransaction/command/CreateStoreTransactionRequestDto';

export const increasePawnTicketRequestSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  amountFinanced: z.number().positive(),
  clerkUserId: z.string().uuid(),
  items: z.array(z.object({
    id: z.string().uuid(),
    priceAmount: z.number().nonnegative()
  })),
  tenders: z.array(createStoreTransactionTenderSchema).optional()
});

export type IncreasePawnTicketRequestDto = z.infer<typeof increasePawnTicketRequestSchema>;
