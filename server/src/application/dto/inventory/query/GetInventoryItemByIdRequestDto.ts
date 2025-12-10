import { z } from 'zod';

export const getInventoryItemByIdRequestSchema = z.object({
  id: z.string().min(1, 'id is required')
});

export type GetInventoryItemByIdRequestDto = z.infer<typeof getInventoryItemByIdRequestSchema>;
