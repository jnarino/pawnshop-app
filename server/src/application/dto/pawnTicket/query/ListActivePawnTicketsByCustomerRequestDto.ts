import { z } from 'zod';

export const listActivePawnTicketsByCustomerRequestSchema = z.object({
  customerId: z.string().uuid()
});

export type ListActivePawnTicketsByCustomerRequestDto = z.infer<
  typeof listActivePawnTicketsByCustomerRequestSchema
>;
