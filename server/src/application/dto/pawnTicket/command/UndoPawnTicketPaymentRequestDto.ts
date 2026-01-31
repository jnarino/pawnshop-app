import { z } from 'zod';
import { createStoreTransactionTenderSchema } from '../../storeTransaction/command/CreateStoreTransactionRequestDto';

export const undoPawnTicketPaymentRequestSchema = z.object({
    pawnTicketId: z.string().uuid(),
    controlNumber: z.string().min(1),
    customerId: z.string().uuid(),
    clerkUserId: z.string().uuid(),
    amount: z.number().positive(), // The amount being undone (positive value in payload)
    tenders: z.array(createStoreTransactionTenderSchema).min(1)
});

export type UndoPawnTicketPaymentRequestDto = z.infer<typeof undoPawnTicketPaymentRequestSchema>;
