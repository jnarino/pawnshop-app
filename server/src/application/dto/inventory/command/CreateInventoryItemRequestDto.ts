import { z } from 'zod';

export const createInventoryItemRequestSchema = z.object({
  inventorySubcategoryId: z.string().uuid('inventorySubcategoryId must be a valid UUID'),

  // Optional – default in DB is 'I'
  status: z.string().min(1).optional(),

  quantity: z
    .number({ invalid_type_error: 'quantity must be a number' })
    .int('quantity must be an integer')
    .positive('quantity must be > 0')
    .optional(),

  brand: z.string().uuid('brand must be a valid UUID'),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  colorId: z.string().optional(),
  itemCondition: z.string().optional(),
  ownerMark: z.string().optional(),
  itemDescription: z.string().optional(),

  priceAmount: z.number().nonnegative('priceAmount must be >= 0'),
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

export type CreateInventoryItemRequestDto = z.infer<typeof createInventoryItemRequestSchema>;
