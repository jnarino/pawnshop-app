import { z } from 'zod';

export const getInventoryItemByInventoryNumberSchema = z.object({
  inventoryNumber: z.string().min(1)
});

export type GetInventoryItemByInventoryNumberDto = z.infer<
  typeof getInventoryItemByInventoryNumberSchema
>;
