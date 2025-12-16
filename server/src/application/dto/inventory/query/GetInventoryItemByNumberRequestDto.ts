import { z } from 'zod';

export const getInventoryItemByNumberRequestSchema = z.object({
  inventoryNumber: z.string().min(1, 'Inventory number is required')
});

export type GetInventoryItemByNumberRequestDto = z.infer<typeof getInventoryItemByNumberRequestSchema>;
