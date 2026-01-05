import { z } from 'zod';

export const closeBalanceCashDrawerRequestSchema = z.object({
  // Main drawer balance with all tender types (positive amounts from frontend)
  mainDrawerBalance: z.object({
    CASH: z.number().min(0),
    'AMERICAN EXPRESS': z.number().min(0).optional().default(0),
    DEBIT: z.number().min(0).optional().default(0),
    DISCOVER: z.number().min(0).optional().default(0),
    'MASTER CARD': z.number().min(0).optional().default(0),
    VISA: z.number().min(0).optional().default(0),
    CHECK: z.number().min(0).optional().default(0),
    'CASH PASS': z.number().min(0).optional().default(0)
  }),
  
  // Optional timestamp (defaults to now)
  occurredAt: z.string().datetime().optional(),
  
  // Optional note
  note: z.string().optional()
});

export type CloseBalanceCashDrawerRequestDto = z.infer<typeof closeBalanceCashDrawerRequestSchema>;
