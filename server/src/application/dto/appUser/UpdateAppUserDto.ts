import { z } from 'zod';
import { createAppUserSchema } from './CreateAppUserDto';

export const updateAppUserSchema = createAppUserSchema
  .omit({ password: true })
  .extend({
    id: z.string().uuid()
  });

export type UpdateAppUserRequestDto = z.infer<typeof updateAppUserSchema>;
