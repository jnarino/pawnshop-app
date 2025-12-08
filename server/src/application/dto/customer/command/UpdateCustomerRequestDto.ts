import { z } from 'zod';
import { createCustomerRequestSchema } from './CreateCustomerRequestDto';

export const updateCustomerRequestSchema = createCustomerRequestSchema.extend({
  id: z.string().uuid()
});

export type UpdateCustomerRequestDto = z.infer<typeof updateCustomerRequestSchema>;
