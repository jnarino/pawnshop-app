import { z } from 'zod';

const booleanFromQuery = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return value;
}, z.boolean());

export const getSalesTaxesRequestSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  onlyTotals: booleanFromQuery.optional(),
});

export type GetSalesTaxesRequestDto = z.infer<typeof getSalesTaxesRequestSchema>;
