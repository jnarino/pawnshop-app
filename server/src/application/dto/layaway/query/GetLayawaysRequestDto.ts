import { z } from 'zod';

export const getLayawaysRequestSchema = z.object({
  status: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type GetLayawaysRequestDto = z.infer<typeof getLayawaysRequestSchema>;
