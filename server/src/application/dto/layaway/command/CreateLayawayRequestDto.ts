import { z } from 'zod';

export const createLayawayItemSchema = z.object({
  inventoryItemId: z.string().optional(),
  description: z.string().min(1),
  amount: z.number().min(0),
  quantity: z.number().int().positive().default(1),
});

export const createLayawayRequestSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(createLayawayItemSchema).min(1),
  downPayment: z.number().min(0),
  period: z.number().int().positive().default(30), // Default 30 days
  note: z.string().optional(),
});

export type CreateLayawayItemDto = z.infer<typeof createLayawayItemSchema>;
export type CreateLayawayRequestDto = z.infer<typeof createLayawayRequestSchema>;
