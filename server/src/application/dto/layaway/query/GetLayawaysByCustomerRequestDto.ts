import { z } from 'zod';

export const getLayawaysByCustomerRequestSchema = z.object({
  customerId: z.string().uuid(),
  status: z.string().optional(),
});

export type GetLayawaysByCustomerRequestDto = z.infer<typeof getLayawaysByCustomerRequestSchema>;
