import { z } from 'zod';

export const getScrapInventoryNumbersRequestSchema = z.object({
  inventoryNumbers: z.array(z.string().min(1)).min(1)
});

export type GetScrapInventoryNumbersRequestDto = z.infer<typeof getScrapInventoryNumbersRequestSchema>;
