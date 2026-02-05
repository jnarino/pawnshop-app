import { z } from 'zod';

const optionalTrimmedString = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
  z.string().trim().min(1).optional()
);

export const findInventoryItemsByParamsRequestSchema = z.object({
  brandId: optionalTrimmedString,
  categoryId: optionalTrimmedString,
  subcategoryId: optionalTrimmedString,
  serialNumber: optionalTrimmedString,
  model: optionalTrimmedString,
  inventoryNumber: optionalTrimmedString
});

export type FindInventoryItemsByParamsRequestDto = z.infer<
  typeof findInventoryItemsByParamsRequestSchema
>;
