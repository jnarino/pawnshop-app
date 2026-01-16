import { z } from 'zod';

export const createInventorySubCategoryRequestSchema = z.object({
  inventoryCategoryId: z.string().uuid(),
  name: z.string().min(1)
});

export type CreateInventorySubCategoryRequestDto = z.infer<typeof createInventorySubCategoryRequestSchema>;
