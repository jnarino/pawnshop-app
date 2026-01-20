import { z } from 'zod';

export const createBrandRequestSchema = z.object({
  inventoryCategoryId: z.string().uuid(),
  name: z.string().min(1)
});

export type CreateBrandRequestDto = z.infer<typeof createBrandRequestSchema>;
