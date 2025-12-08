import { z } from 'zod';

export const listPawnTicketsByCustomerRequestSchema = z.object({
  customerId: z.string().uuid()
});

export type ListPawnTicketsByCustomerRequestDto = z.infer<
  typeof listPawnTicketsByCustomerRequestSchema
>;
