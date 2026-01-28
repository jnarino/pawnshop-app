import { z } from 'zod';

export const listHistoryPawnsByCustomerRequestSchema = z.object({
  customerId: z.string().uuid('customerId must be a valid UUID')
});

export type ListHistoryPawnsByCustomerRequestDto = z.infer<typeof listHistoryPawnsByCustomerRequestSchema>;

export type PawnHistoryItemDto = {
  id: string;
  description: string;
};

export type PawnHistoryResponseDto = {
  id: string;
  controlNumber: string;
  dateIn: string; // ISO format
  dateOut: string | null; // ISO format, nullable
  status: string;
  clerkUsername?: string;
  amount: number;
  amountPaid: number;
  items: PawnHistoryItemDto[];
};
