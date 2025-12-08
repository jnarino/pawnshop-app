import { z } from 'zod';

/**
 * We keep them as strings here so the use-case can decide:
 * - date-only => clamp to start/end of day
 * - date+time => respect the time
 */
export const listStoreTransactionsByDateRangeRequestSchema = z.object({
  from: z.string().min(1, '`from` is required'),
  to: z.string().min(1, '`to` is required'),
});

export type ListStoreTransactionsByDateRangeRequestDto = z.infer<
  typeof listStoreTransactionsByDateRangeRequestSchema
>;
