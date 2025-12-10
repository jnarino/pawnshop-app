import { z } from 'zod';

export const getInventoryItemBySerialNumberSchema = z.object({
  serialNumber: z.string().min(1)
});

export type GetInventoryItemBySerialNumberDto = z.infer<
  typeof getInventoryItemBySerialNumberSchema
>;
