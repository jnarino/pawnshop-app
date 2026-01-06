import { z } from 'zod';

export const pullPawnTicketItemsToInventoryRequestSchema = z.object({
  pawnTicketId: z.string().uuid(),
  controlNumber: z.string().min(1),
  typeTicket: z.enum(['PAWN', 'PURCHASE']),
  clerkUserId: z.string().uuid(),
  transactionDate: z.string().transform((s) => new Date(s)),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      itemStatus: z.enum(['I', 'J']).optional(),
      scrappedIntoInvItem: z.array(
        z.object({
          inventoryNumber: z.string().min(1),
          quantity: z.number().positive()
        })
      ).optional(),
      resale: z.number().min(0).optional(),
      minResale: z.number().min(0).optional()
    })
  ).min(1)
});

export type PullPawnTicketItemsToInventoryRequestDto = z.infer<typeof pullPawnTicketItemsToInventoryRequestSchema>;
