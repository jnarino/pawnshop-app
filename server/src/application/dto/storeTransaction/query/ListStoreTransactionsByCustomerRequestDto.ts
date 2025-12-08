import { z } from 'zod';

export const listStoreTransactionsByCustomerRequestSchema = z.object({
  customerId: z.string().uuid(),
});

export type ListStoreTransactionsByCustomerRequestDto = z.infer<
  typeof listStoreTransactionsByCustomerRequestSchema
>;
