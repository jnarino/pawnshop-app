import { z } from 'zod';

export const addMoneyToMainDrawerRequestSchema = z.object({
  amount: z.coerce.number().positive('amount must be positive'),
  note: z.string().max(500).optional(),
  occurredAt: z.string().datetime().optional(),
  transactionTenderName: z.string().min(1, 'transactionTenderName is required'),
  isFromBank: z.boolean()
});

export type AddMoneyToMainDrawerRequestDto = z.infer<typeof addMoneyToMainDrawerRequestSchema>;
