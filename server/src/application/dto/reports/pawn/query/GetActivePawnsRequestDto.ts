import { z } from 'zod';

export const getActivePawnsRequestSchema = z.object({
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
});

export type GetActivePawnsRequestDto = z.infer<typeof getActivePawnsRequestSchema>;
