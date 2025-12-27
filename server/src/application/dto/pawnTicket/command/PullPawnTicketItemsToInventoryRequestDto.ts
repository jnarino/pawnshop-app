import { z } from 'zod';

export const pullPawnTicketItemsToInventoryRequestSchema = z.object({
  pawnTicketId: z.string().uuid(),
  controlNumber: z.string().min(1),
  typeTicket: z.enum(['PAWN', 'PURCHASE']),
  ticketStatus: z.enum(['D', 'I']),
  defaultMarkedBy: z.string().uuid(),
  transactionDate: z.string().transform((s) => new Date(s)),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      quantity: z.number().int().min(1),
      itemStatus: z.enum(['I', 'J']),
      scrappedIntoInvItem: z.string().min(1).optional(),
      resale: z.number().min(0).optional(),
      minResale: z.number().min(0).optional()
    })
  ).min(1)
});

export type PullPawnTicketItemsToInventoryRequestDto = z.infer<typeof pullPawnTicketItemsToInventoryRequestSchema>;
