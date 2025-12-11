import { z } from 'zod';

export const createInventoryCategoryRequestSchema = z.object({
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid(),
  brand: z.string().uuid(),
  path: z.string()
});

export type CreateInventoryCategoryRequestDto = z.infer<
  typeof createInventoryCategoryRequestSchema
>;
