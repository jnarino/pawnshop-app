import { z } from 'zod';

export const getAllItemsInventoryRequestSchema = z.object({
	categoryId: z.string().uuid().optional(),
	subcategoryId: z.string().uuid().optional(),
	excludeJewelryAndFirearm: z.boolean().optional().default(false),
});

export type GetAllItemsInventoryRequestDto = z.infer<typeof getAllItemsInventoryRequestSchema>;
