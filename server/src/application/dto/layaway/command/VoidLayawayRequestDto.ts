import { z } from 'zod';

export const voidLayawayTenderSchema = z.object({
  tenderTypeId: z.number().int().positive(),
  amount: z.number(),
});

export const voidLayawayItemSchema = z.object({
  inventoryItemId: z.string().uuid().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  quantity: z.number().positive().default(1),
  price: z.number().nullable().optional(),
});

export const voidLayawayRequestSchema = z.object({
  controlNumber: z.string().min(1, "Control number is required"),
  items: z.array(voidLayawayItemSchema).optional().default([]),
  tenders: z.array(voidLayawayTenderSchema).min(1, "At least one tender is required"),
  note: z.string().optional()
});

export type VoidLayawayTenderDto = z.infer<typeof voidLayawayTenderSchema>;
export type VoidLayawayItemDto = z.infer<typeof voidLayawayItemSchema>;
export type VoidLayawayRequestDto = z.infer<typeof voidLayawayRequestSchema>;
