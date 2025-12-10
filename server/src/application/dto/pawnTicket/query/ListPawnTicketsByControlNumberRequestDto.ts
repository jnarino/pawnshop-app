import { z } from 'zod';

export const listPawnTicketsByControlNumberRequestSchema = z.object({
  controlNumber: z.string().min(1)
});

export type ListPawnTicketsByControlNumberRequestDto = z.infer<
  typeof listPawnTicketsByControlNumberRequestSchema
>;
