import { z } from 'zod';

export const updateInventoryItemRequestSchema = z.object({
  id: z.string().min(1, 'id is required'),

  categoryId: z.string().optional(),
  status: z.string().optional(),
  quantity: z
    .number({ invalid_type_error: 'quantity must be a number' })
    .int()
    .positive()
    .optional(),

  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  colorId: z.string().optional(),
  itemCondition: z.string().optional(),
  ownerMark: z.string().optional(),
  itemDescription: z.string().optional(),

  priceAmount: z.number().nonnegative().optional(),
  resale: z.number().nonnegative().optional(),
  minResale: z.number().nonnegative().optional(),
  itemReplace: z.number().nonnegative().optional(),

  extra: z.record(z.string(), z.any()).optional(),
  attributes: z.record(z.string(), z.any()).optional(),

  legacyInventoryNumber: z.string().optional(),
  legacyItemGuid: z.string().optional(),
  legacyCategoryDescription: z.string().optional(),
  legacyBrandColorDescription: z.string().optional(),

  inventoryNumber: z.string().optional()
});

export type UpdateInventoryItemRequestDto = z.infer<typeof updateInventoryItemRequestSchema>;
