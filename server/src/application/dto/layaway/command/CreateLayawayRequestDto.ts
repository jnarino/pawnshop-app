import { z } from 'zod';

export const createLayawayItemSchema = z.object({
  inventoryItemId: z.string().nullable().optional(), // Modified to allow null/undefined for custom items
  inventoryNumber: z.string().optional(),
  description: z.string().min(1),
  price: z.number().min(0),
  quantity: z.number().int().positive().default(1),
});

export const createLayawayTenderSchema = z.object({
  tenderTypeId: z.number().int(),
  amount: z.number().min(0)
});

export const createLayawayRequestSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(createLayawayItemSchema).min(1),
  tenders: z.array(createLayawayTenderSchema).default([]),
  taxExemptUsed: z.boolean().default(false),
  eatTax: z.boolean().default(false).optional(),
  note: z.string().optional(),
});

export type CreateLayawayItemDto = z.infer<typeof createLayawayItemSchema>;
export type CreateLayawayTenderDto = z.infer<typeof createLayawayTenderSchema>;
export type CreateLayawayRequestDto = z.infer<typeof createLayawayRequestSchema>;
