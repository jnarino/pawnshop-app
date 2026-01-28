import { z } from 'zod';

export const voidLayawayRequestSchema = z.object({
  ticketnum: z.string().min(1, "Ticket number is required"),
  amountToReturn: z.number().min(0, "Amount to return cannot be negative"),
  tenderTypeId: z.number().int("Tender type ID must be an integer"),
  note: z.string().optional()
});

export type VoidLayawayRequestDto = z.infer<typeof voidLayawayRequestSchema>;
