import { z } from 'zod';

export const createInventoryAttributeValueRequestSchema = z.object({
  attributeTypeId: z.string().uuid(),
  value: z.string().min(1)
});

export type CreateInventoryAttributeValueRequestDto = z.infer<typeof createInventoryAttributeValueRequestSchema>;
