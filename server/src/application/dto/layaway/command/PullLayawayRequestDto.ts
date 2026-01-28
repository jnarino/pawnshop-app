import { z } from 'zod';

export const pullLayawayRequestSchema = z.object({
  ticketnum: z.string().min(1, "Ticket number is required"),
  customerId: z.string().uuid("Customer ID is required")
});

export type PullLayawayRequestDto = z.infer<typeof pullLayawayRequestSchema>;
