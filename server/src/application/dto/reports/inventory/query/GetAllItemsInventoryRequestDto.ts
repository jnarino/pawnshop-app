import { z } from 'zod';

export const getAllItemsInventoryRequestSchema = z.object({});

export type GetAllItemsInventoryRequestDto = z.infer<typeof getAllItemsInventoryRequestSchema>;
