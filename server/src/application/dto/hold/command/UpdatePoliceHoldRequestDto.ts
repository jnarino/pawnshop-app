import { z } from 'zod';
import { createPoliceHoldRequestSchema } from './CreatePoliceHoldRequestDto';

export const updatePoliceHoldRequestSchema = createPoliceHoldRequestSchema.extend({
  id: z.string().uuid()
});

export type UpdatePoliceHoldRequestDto = z.infer<typeof updatePoliceHoldRequestSchema>;
