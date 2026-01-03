import { z } from 'zod';

export const removeCashFromMainDrawerRequestSchema = z.object({
  amount: z.coerce.number().positive('amount must be positive'),
  note: z.string().max(500).optional(),
  occurredAt: z.string().datetime().optional()
});

export type RemoveCashFromMainDrawerRequestDto = z.infer<typeof removeCashFromMainDrawerRequestSchema>;
