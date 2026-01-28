import { z } from 'zod';

export const unpullLayawayRequestSchema = z.object({
  ticketnum: z.string().min(1, "Ticket number is required")
});

export type UnpullLayawayRequestDto = z.infer<typeof unpullLayawayRequestSchema>;
