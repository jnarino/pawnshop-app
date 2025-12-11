import { z } from 'zod';

export const getAttributeValuesByTypeRequestSchema = z.object({
  attributeTypeId: z.string().uuid()
});

export type GetAttributeValuesByTypeRequestDto = z.infer<typeof getAttributeValuesByTypeRequestSchema>;
