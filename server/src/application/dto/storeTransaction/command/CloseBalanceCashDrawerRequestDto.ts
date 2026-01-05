import { z } from 'zod';

export const closeBalanceCashDrawerRequestSchema = z.object({
  // The balance to record for the close
  cashBalance: z.number(),
  
  // Individual tender amounts to deposit (will create negative DEPOSIT FROM MAIN transactions)
  tenderAmounts: z.object({
    cash: z.number().optional(),
    americanExpress: z.number().optional(),
    debit: z.number().optional(),
    discover: z.number().optional(),
    masterCard: z.number().optional(),
    visa: z.number().optional(),
    check: z.number().optional(),
    cashPass: z.number().optional()
  }),
  
  // Optional timestamp (defaults to now)
  occurredAt: z.string().datetime().optional(),
  
  // Optional note
  note: z.string().optional()
});

export type CloseBalanceCashDrawerRequestDto = z.infer<typeof closeBalanceCashDrawerRequestSchema>;
