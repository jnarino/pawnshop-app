import { z } from 'zod';

export const getCustomerByIdRequestSchema = z.object({
  id: z.string().uuid()
});

export type GetCustomerByIdRequestDto = z.infer<typeof getCustomerByIdRequestSchema>;
