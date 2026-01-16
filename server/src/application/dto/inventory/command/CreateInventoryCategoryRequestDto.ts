import { z } from 'zod';

export const createInventoryCategoryRequestSchema = z.object({
  name: z.string().min(1)
});

export type CreateInventoryCategoryRequestDto = z.infer<typeof createInventoryCategoryRequestSchema>;
