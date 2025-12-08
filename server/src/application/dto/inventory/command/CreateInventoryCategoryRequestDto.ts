import { z } from 'zod';

export const createInventoryCategoryRequestSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  parentId: z.string().uuid().nullable().optional()
});

export type CreateInventoryCategoryRequestDto = z.infer<
  typeof createInventoryCategoryRequestSchema
>;
