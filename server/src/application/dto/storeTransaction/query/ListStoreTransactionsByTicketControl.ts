import { z } from 'zod';

/**
 * We keep them as strings here so the use-case can decide:
 * - date-only => clamp to start/end of day
 * - date+time => respect the time
 */
export const listStoreTransactionsByTicketControlRequestSchema = z.object({
  controlNumber: z.string().min(1, '`controlNumber` is required'),
});

export type ListStoreTransactionsByTicketControlRequestDto = z.infer<
  typeof listStoreTransactionsByTicketControlRequestSchema
>;
