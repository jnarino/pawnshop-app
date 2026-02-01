import { z } from 'zod';

export const getActivePawnsRequestSchema = z.object({
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  excludeJewelryAndFirearm: z.boolean().optional().default(false),
});

export type GetActivePawnsRequestDto = z.infer<typeof getActivePawnsRequestSchema>;
